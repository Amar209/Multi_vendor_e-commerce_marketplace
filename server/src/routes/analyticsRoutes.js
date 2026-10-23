import express from 'express';
import { getAdminAnalytics, getVendorAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin'), getAdminAnalytics);
router.get('/vendor', authorize('vendor'), getVendorAnalytics);

export default router;
