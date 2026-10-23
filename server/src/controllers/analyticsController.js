import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';

// @desc    Get platform-wide admin analytics
// @route   GET /api/analytics/admin
// @access  Private (Admin)
export const getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalVendors = await Vendor.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Financial totals
    const financialStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          grossMerchandiseValue: { $sum: '$totalAmount' },
          platformCommissions: { $sum: '$commissionTotal' },
          totalSubtotal: { $sum: '$subtotal' }
        }
      }
    ]);

    const stats = financialStats[0] || {
      grossMerchandiseValue: 0,
      platformCommissions: 0,
      totalSubtotal: 0
    };

    // Recent orders
    const recentOrders = await Order.find()
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalCustomers,
          totalVendors,
          totalProducts,
          totalOrders,
          grossMerchandiseValue: stats.grossMerchandiseValue,
          platformCommissions: stats.platformCommissions
        },
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get vendor-specific analytics
// @route   GET /api/analytics/vendor
// @access  Private (Vendor)
export const getVendorAnalytics = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Vendor store not found.' });
    }

    const totalProducts = await Product.countDocuments({ vendor: vendor._id });

    // Aggregate orders for this vendor
    const orders = await Order.find({ 'items.vendor': vendor._id });

    let totalVendorSales = 0;
    let totalItemsSold = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.vendor.toString() === vendor._id.toString()) {
          totalVendorSales += item.vendorEarningAmount;
          totalItemsSold += item.quantity;
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        storeName: vendor.storeName,
        commissionRate: vendor.commissionRate,
        balance: vendor.balance,
        totalProducts,
        totalOrdersCount: orders.length,
        totalVendorSales,
        totalItemsSold
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
