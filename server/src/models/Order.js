import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  title: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  // Multi-vendor settlement fields:
  vendorCommissionRate: { type: Number, default: 10 },
  platformCommissionAmount: { type: Number, required: true },
  vendorEarningAmount: { type: Number, required: true },
  vendorFulfillmentStatus: {
    type: String,
    enum: ['placed', 'packed', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  }
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    items: [orderItemSchema],
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    paymentInfo: {
      provider: { type: String, enum: ['card', 'upi', 'netbanking', 'stripe', 'razorpay', 'cod'], default: 'card' },
      paymentIntentId: String,
      status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' }
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    commissionTotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ['placed', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'placed'
    }
  },
  {
    timestamps: true
  }
);

export const Order = mongoose.model('Order', orderSchema);
