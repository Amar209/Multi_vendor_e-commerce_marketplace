import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cartController.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();

// Optional auth helper: attaches user if token is present, otherwise allows guest cart
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zero_cost_jwt_dev_secret_2026');
      req.user = await User.findById(decoded.id);
    } catch {
      // Ignore token failure for guest fallback
    }
  }
  next();
};

router.use(optionalAuth);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route('/:productId')
  .put(updateCartItem)
  .delete(removeCartItem);

export default router;
