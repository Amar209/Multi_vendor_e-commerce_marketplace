import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing demo collections...');
    await User.deleteMany();
    await Vendor.deleteMany();
    await Product.deleteMany();

    console.log('[Seed] Creating System Roles (Admin, Vendors, Customer)...');

    // 1. Admin Account
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@marketplace.com',
      password: 'password123',
      role: 'admin',
      phone: '+91 9876543210'
    });

    // 2. Vendor 1: Electronics
    const vendorUser1 = await User.create({
      name: 'Rohan Sharma',
      email: 'tech@vendor.com',
      password: 'password123',
      role: 'vendor',
      phone: '+91 9876543211'
    });

    const vendor1 = await Vendor.create({
      user: vendorUser1._id,
      storeName: 'TechHub Electronics',
      description: 'Authorized retailer for premium consumer audio, wearables, and gadgets.',
      contactEmail: 'tech@vendor.com',
      contactPhone: '+91 9876543211',
      commissionRate: 8, // 8% commission
      balance: { available: 12500, pending: 2400 },
      totalSales: 45000
    });
    vendorUser1.vendorProfile = vendor1._id;
    await vendorUser1.save();

    // 3. Vendor 2: Fashion & Apparel
    const vendorUser2 = await User.create({
      name: 'Priya Mehta',
      email: 'urban@vendor.com',
      password: 'password123',
      role: 'vendor',
      phone: '+91 9876543212'
    });

    const vendor2 = await Vendor.create({
      user: vendorUser2._id,
      storeName: 'Urban Vogue Studio',
      description: 'Sustainable contemporary streetwear and handcrafted organic textiles.',
      contactEmail: 'urban@vendor.com',
      contactPhone: '+91 9876543212',
      commissionRate: 12, // 12% commission
      balance: { available: 8900, pending: 1500 },
      totalSales: 28000
    });
    vendorUser2.vendorProfile = vendor2._id;
    await vendorUser2.save();

    // 4. Customer Account
    const customer = await User.create({
      name: 'Alex Johnson',
      email: 'customer@example.com',
      password: 'password123',
      role: 'customer',
      phone: '+91 9876543213',
      addresses: [
        {
          street: '42 Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
          isDefault: true
        }
      ]
    });

    console.log('[Seed] Creating Multi-Vendor Catalog Products...');

    const products = [
      {
        vendor: vendor1._id,
        title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        description: 'Industry-leading noise cancellation optimized by two processors and 8 microphones. Up to 30-hour battery life with quick charging.',
        category: 'Electronics',
        brand: 'Sony',
        price: 29990,
        discountPrice: 26990,
        stock: 18,
        ratingAverage: 4.8,
        numReviews: 42,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800']
      },
      {
        vendor: vendor1._id,
        title: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum',
        description: 'Powerful S9 SiP with Double Tap gesture, brighter edge-to-edge display, and on-device Siri with health metrics.',
        category: 'Electronics',
        brand: 'Apple',
        price: 44900,
        discountPrice: 41900,
        stock: 12,
        ratingAverage: 4.9,
        numReviews: 29,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']
      },
      {
        vendor: vendor1._id,
        title: 'Mechanical Gaming Keyboard RGB Backlit Hot-Swappable',
        description: 'Custom linear switches, sound dampening foam, per-key RGB illumination, and braided USB-C detachable cable.',
        category: 'Electronics',
        brand: 'Keychron',
        price: 7999,
        discountPrice: 6499,
        stock: 25,
        ratingAverage: 4.7,
        numReviews: 15,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800']
      },
      {
        vendor: vendor2._id,
        title: 'Organic Heavyweight Oversized Cotton Hoodie',
        description: '450 GSM French Terry cotton hoodie with dropped shoulders, double-layered hood, and minimal embroidered chest accent.',
        category: 'Fashion',
        brand: 'Urban Vogue',
        price: 2999,
        discountPrice: 2499,
        stock: 40,
        ratingAverage: 4.6,
        numReviews: 33,
        images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800']
      },
      {
        vendor: vendor2._id,
        title: 'Handcrafted Genuine Italian Leather Messenger Bag',
        description: 'Vegetable-tanned full grain leather with padded 15-inch laptop compartment, brass buckles, and adjustable shoulder strap.',
        category: 'Fashion',
        brand: 'Artisan Works',
        price: 8499,
        discountPrice: 7299,
        stock: 14,
        ratingAverage: 4.9,
        numReviews: 19,
        images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800']
      },
      {
        vendor: vendor2._id,
        title: 'Minimalist Canvas High-Top Sneakers - Bone White',
        description: 'Vulcanized rubber sole, cushioned memory foam insole, and durable organic cotton canvas upper.',
        category: 'Footwear',
        brand: 'Urban Vogue',
        price: 3499,
        discountPrice: 2999,
        stock: 30,
        ratingAverage: 4.5,
        numReviews: 12,
        images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800']
      }
    ];

    await Product.insertMany(products);

    console.log('\n================================================================');
    console.log('✅ Demo Seed Data Loaded Successfully!');
    console.log('----------------------------------------------------------------');
    console.log('👤 Admin:    admin@marketplace.com | password123');
    console.log('🏪 Vendor 1: tech@vendor.com       | password123 (TechHub Electronics)');
    console.log('🏪 Vendor 2: urban@vendor.com      | password123 (Urban Vogue Studio)');
    console.log('🛒 Customer: customer@example.com  | password123 (Alex Johnson)');
    console.log('================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedData();
