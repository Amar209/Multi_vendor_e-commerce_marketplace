import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { getRedisClient } from '../config/redis.js';

export const resetCleanSlate = async () => {
  try {
    console.log('[CleanSlate] Resetting database to a clean production slate...');

    // Clear all existing data
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Vendor.deleteMany({});
    await User.deleteMany({});

    // Clear Redis carts
    try {
      const redis = getRedisClient();
      const keys = await redis.keys('cart:*');
      if (keys.length) await redis.del(...keys);
    } catch (e) {
      // ignore redis key error
    }

    const ADMIN_ID = '65f000000000000000000001';
    const VENDOR_USER_ID = '65f000000000000000000002';
    const VENDOR_PROFILE_ID = '65f000000000000000000003';
    const CUSTOMER_ID = '65f000000000000000000004';

    // 1. Clean Super Admin Account
    await User.create({
      _id: ADMIN_ID,
      name: 'Platform Administrator',
      email: 'admin@marketplace.com',
      password: 'password123',
      role: 'admin',
      phone: '+91 9876543210'
    });

    // 2. Clean Vendor Account (TechHub Electronics with 0 balance & 0 products)
    const vendorUser = await User.create({
      _id: VENDOR_USER_ID,
      name: 'Rohan Sharma',
      email: 'tech@vendor.com',
      password: 'password123',
      role: 'vendor',
      phone: '+91 9876543211'
    });

    const vendor = await Vendor.create({
      _id: VENDOR_PROFILE_ID,
      user: vendorUser._id,
      storeName: 'TechHub Electronics',
      description: 'Authorized retailer for audio, wearables, and electronics.',
      contactEmail: 'tech@vendor.com',
      contactPhone: '+91 9876543211',
      commissionRate: 10,
      balance: { available: 0, pending: 0 },
      totalSales: 0
    });

    vendorUser.vendorProfile = vendor._id;
    await vendorUser.save();

    // 3. Clean Customer Account (Alex Johnson with 0 orders)
    await User.create({
      _id: CUSTOMER_ID,
      name: 'Alex Johnson',
      email: 'customer@example.com',
      password: 'password123',
      role: 'customer',
      phone: '+91 9876543212',
      addresses: [
        {
          street: '12 Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
          isDefault: true
        }
      ]
    });

    console.log('[CleanSlate] Clean accounts initialized with deterministic IDs, ₹0 balance, 0 products, 0 orders.');
  } catch (err) {
    console.error(`[CleanSlate Error] ${err.message}`);
  }
};

export const autoSeedIfEmpty = async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await resetCleanSlate();
  }
};
