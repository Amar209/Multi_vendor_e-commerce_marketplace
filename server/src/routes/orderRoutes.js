import express from 'express';
import {
  createOrder,
  getMyOrders,
  getVendorOrders,
  updateFulfillmentStatus,
  downloadInvoice
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/vendor/incoming', authorize('vendor'), getVendorOrders);
router.put('/:orderId/items/:itemId/status', authorize('vendor', 'admin'), updateFulfillmentStatus);
router.get('/:id/invoice', downloadInvoice);

export default router;
