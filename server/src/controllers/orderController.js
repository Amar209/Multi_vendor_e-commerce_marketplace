import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Vendor } from '../models/Vendor.js';
import { Coupon } from '../models/Coupon.js';
import { getRedisClient } from '../config/redis.js';
import PDFDocument from 'pdfkit';

// @desc    Create new order with multi-vendor split calculation
// @route   POST /api/orders
// @access  Private (Customer)
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'stripe', couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided.' });
    }

    let subtotal = 0;
    let commissionTotal = 0;
    const processedItems = [];
    const vendorEarningsMap = new Map();

    // Validate products, check stock, calculate split payments
    for (const item of items) {
      const product = await Product.findById(item.productId).populate('vendor');
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${product.title}". Only ${product.stock} available.`
        });
      }

      const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      const lineTotal = unitPrice * item.quantity;
      const commissionRate = product.vendor.commissionRate || 10;
      const commissionAmount = Number(((lineTotal * commissionRate) / 100).toFixed(2));
      const vendorEarning = Number((lineTotal - commissionAmount).toFixed(2));

      subtotal += lineTotal;
      commissionTotal += commissionAmount;

      // Accumulate vendor earnings for payout reconciliation
      const vendorIdStr = product.vendor._id.toString();
      const currentVendorTotal = vendorEarningsMap.get(vendorIdStr) || 0;
      vendorEarningsMap.set(vendorIdStr, currentVendorTotal + vendorEarning);

      // Decrement inventory
      product.stock -= item.quantity;
      await product.save();

      processedItems.push({
        product: product._id,
        vendor: product.vendor._id,
        title: product.title,
        image: product.images[0] || '',
        price: unitPrice,
        quantity: item.quantity,
        vendorCommissionRate: commissionRate,
        platformCommissionAmount: commissionAmount,
        vendorEarningAmount: vendorEarning,
        vendorFulfillmentStatus: 'placed'
      });
    }

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || 5000);
        } else {
          discountAmount = Math.min(coupon.discountValue, subtotal);
        }
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const shippingFee = discountedSubtotal > 1000 ? 0 : 50;
    const tax = Number((discountedSubtotal * 0.05).toFixed(2)); // 5% GST/Tax
    const totalAmount = Number((discountedSubtotal + shippingFee + tax).toFixed(2));

    const orderNumber = `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Create Order in DB
    const order = await Order.create({
      customer: req.user._id,
      orderNumber,
      items: processedItems,
      shippingAddress: shippingAddress || {
        street: '123 Market Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India'
      },
      paymentInfo: {
        provider: paymentMethod,
        paymentIntentId: `pi_test_${Date.now()}`,
        status: 'paid'
      },
      subtotal,
      discount: discountAmount,
      couponCode: couponCode ? couponCode.toUpperCase() : '',
      tax,
      shippingFee,
      commissionTotal,
      totalAmount,
      orderStatus: 'placed'
    });

    // Credit earnings to each respective vendor's balance
    for (const [vendorId, earning] of vendorEarningsMap.entries()) {
      await Vendor.findByIdAndUpdate(vendorId, {
        $inc: {
          'balance.available': earning,
          totalSales: earning
        }
      });
    }

    // Clear user's Redis cart after successful checkout
    const redis = getRedisClient();
    await redis.del(`cart:user:${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Order created and split payment processed successfully.',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Order creation failed.' });
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/my-orders
// @access  Private (Customer)
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('items.product', 'title images')
      .populate('items.vendor', 'storeName logo')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor's incoming orders to fulfill
// @route   GET /api/orders/vendor/incoming
// @access  Private (Vendor)
export const getVendorOrders = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Vendor store not found.' });
    }

    const orders = await Order.find({ 'items.vendor': vendor._id })
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    // Filter order items specifically relevant to this vendor
    const vendorFilteredOrders = orders.map(order => {
      const vendorItems = order.items.filter(i => i.vendor.toString() === vendor._id.toString());
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        overallStatus: order.orderStatus,
        vendorItems,
        vendorTotalEarnings: vendorItems.reduce((acc, i) => acc + i.vendorEarningAmount, 0)
      };
    });

    res.status(200).json({ success: true, count: vendorFilteredOrders.length, data: vendorFilteredOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update item fulfillment status by Vendor (placed -> packed -> shipped -> delivered)
// @route   PUT /api/orders/:orderId/items/:itemId/status
// @access  Private (Vendor)
export const updateFulfillmentStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const validStatuses = ['placed', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid fulfillment status.' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found.' });
    }

    item.vendorFulfillmentStatus = status;

    // If all items are delivered, mark entire order as delivered
    const allDelivered = order.items.every(i => i.vendorFulfillmentStatus === 'delivered');
    if (allDelivered) order.orderStatus = 'delivered';
    else if (status === 'shipped') order.orderStatus = 'shipped';

    await order.save();

    res.status(200).json({ success: true, message: 'Fulfillment status updated.', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download automated PDF invoice for order
// @route   GET /api/orders/:id/invoice
// @access  Private (Customer / Vendor / Admin)
export const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.vendor', 'storeName');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.orderNumber}.pdf"`);

    doc.pipe(res);

    // Invoice Header
    doc.fontSize(22).text('TAX INVOICE / RECEIPT', { align: 'right' });
    doc.fontSize(10).text('Multi-Vendor E-Commerce Marketplace Inc.', { align: 'right' });
    doc.text('Platform Support: contact@marketplace.com', { align: 'right' });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice Number: ${order.orderNumber}`);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Payment Status: ${order.paymentInfo.status.toUpperCase()} (${order.paymentInfo.provider})`);
    doc.moveDown();

    // Customer details
    doc.fontSize(14).text('Billed To:');
    doc.fontSize(10).text(`Name: ${order.customer?.name || 'Customer'}`);
    doc.text(`Email: ${order.customer?.email || 'N/A'}`);
    doc.text(`Address: ${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.postalCode}`);
    doc.moveDown();

    // Line items table
    doc.fontSize(12).text('Itemized Details:');
    doc.text('--------------------------------------------------------------------------------------------------');
    doc.fontSize(10);
    order.items.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.title} | Store: ${item.vendor?.storeName || 'Vendor'} | Qty: ${item.quantity} | Unit: Rs. ${item.price.toLocaleString()} | Total: Rs. ${(item.price * item.quantity).toLocaleString()}`
      );
    });
    doc.text('--------------------------------------------------------------------------------------------------');
    doc.moveDown();

    // Totals
    doc.fontSize(11).text(`Subtotal: Rs. ${order.subtotal.toLocaleString()}`, { align: 'right' });
    if (order.discount && order.discount > 0) {
      doc.text(`Promo Discount (${order.couponCode || 'APPLIED'}): -Rs. ${order.discount.toLocaleString()}`, { align: 'right' });
    }
    doc.text(`Shipping: Rs. ${order.shippingFee.toLocaleString()}`, { align: 'right' });
    doc.text(`Tax / GST (5%): Rs. ${order.tax.toLocaleString()}`, { align: 'right' });
    doc.fontSize(14).text(`Grand Total: Rs. ${order.totalAmount.toLocaleString()}`, { align: 'right' });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
