import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true
    },
    description: {
      type: String,
      default: ''
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200'
    },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200'
    },
    contactEmail: {
      type: String,
      required: true
    },
    contactPhone: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'rejected'],
      default: 'approved' // Automatically approved in demo/dev mode for seamless testing
    },
    commissionRate: {
      type: Number,
      default: 10, // 10% platform commission fee
      min: 0,
      max: 100
    },
    payoutAccountId: {
      type: String, // Stripe Connected account ID or Razorpay Linked Account ID
      default: ''
    },
    balance: {
      available: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    },
    totalSales: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Slugify storeName before saving
vendorSchema.pre('save', function (next) {
  if (this.isModified('storeName')) {
    this.slug = this.storeName
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  next();
});

export const Vendor = mongoose.model('Vendor', vendorSchema);
