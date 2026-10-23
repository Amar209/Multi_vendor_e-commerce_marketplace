import { getRedisClient } from '../config/redis.js';
import { Product } from '../models/Product.js';

// Helper to determine cart key
const getCartKey = (req) => {
  if (req.user) {
    return `cart:user:${req.user._id}`;
  }
  const guestId = req.headers['x-guest-id'] || 'anonymous';
  return `cart:guest:${guestId}`;
};

// @desc    Get user's shopping cart from Redis cache
// @route   GET /api/cart
// @access  Public / Private
export const getCart = async (req, res) => {
  try {
    const redis = getRedisClient();
    const cartKey = getCartKey(req);

    const rawCart = await redis.get(cartKey);
    const items = rawCart ? JSON.parse(rawCart) : [];

    // Hydrate latest product details from DB
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate('vendor', 'storeName commissionRate');

    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let subtotal = 0;
    const hydratedItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (product) {
        const itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
        const lineTotal = itemPrice * item.quantity;
        subtotal += lineTotal;

        hydratedItems.push({
          productId: product._id,
          title: product.title,
          image: product.images[0] || '',
          price: itemPrice,
          originalPrice: product.price,
          quantity: item.quantity,
          stock: product.stock,
          vendor: {
            id: product.vendor._id,
            storeName: product.vendor.storeName,
            commissionRate: product.vendor.commissionRate
          },
          lineTotal
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        items: hydratedItems,
        itemCount: hydratedItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal,
        cacheSource: 'redis'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Cart retrieval failed.' });
  }
};

// @desc    Add item to cart or increment quantity
// @route   POST /api/cart
// @access  Public / Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const redis = getRedisClient();
    const cartKey = getCartKey(req);

    const rawCart = await redis.get(cartKey);
    let items = rawCart ? JSON.parse(rawCart) : [];

    const existingIndex = items.findIndex(i => i.productId === productId);
    if (existingIndex > -1) {
      items[existingIndex].quantity += Number(quantity);
    } else {
      items.push({ productId, quantity: Number(quantity) });
    }

    // Save back to Redis with 7-day TTL
    await redis.set(cartKey, JSON.stringify(items), 'EX', 60 * 60 * 24 * 7);

    res.status(200).json({
      success: true,
      message: 'Item added to Redis cart successfully.',
      items
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update quantity of item in cart
// @route   PUT /api/cart/:productId
// @access  Public / Private
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const redis = getRedisClient();
    const cartKey = getCartKey(req);

    const rawCart = await redis.get(cartKey);
    let items = rawCart ? JSON.parse(rawCart) : [];

    if (Number(quantity) <= 0) {
      items = items.filter(i => i.productId !== productId);
    } else {
      const item = items.find(i => i.productId === productId);
      if (item) {
        item.quantity = Number(quantity);
      }
    }

    await redis.set(cartKey, JSON.stringify(items), 'EX', 60 * 60 * 24 * 7);
    res.status(200).json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove single item from cart
// @route   DELETE /api/cart/:productId
// @access  Public / Private
export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const redis = getRedisClient();
    const cartKey = getCartKey(req);

    const rawCart = await redis.get(cartKey);
    let items = rawCart ? JSON.parse(rawCart) : [];

    items = items.filter(i => i.productId !== productId);
    await redis.set(cartKey, JSON.stringify(items), 'EX', 60 * 60 * 24 * 7);

    res.status(200).json({ success: true, message: 'Item removed from cart.', items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Public / Private
export const clearCart = async (req, res) => {
  try {
    const redis = getRedisClient();
    const cartKey = getCartKey(req);
    await redis.del(cartKey);
    res.status(200).json({ success: true, message: 'Cart cleared successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
