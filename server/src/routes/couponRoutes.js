import express from 'express';
import { validateCoupon, getActiveCoupons, createCoupon } from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getActiveCoupons);
router.post('/validate', validateCoupon);
router.post('/apply', validateCoupon);
router.post('/', protect, authorize('admin', 'vendor'), createCoupon);

export default router;
