import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Reset database to fresh clean slate (0 products, 0 orders, 0 balances)
router.post('/reset-clean', async (req, res) => {
  const { resetCleanSlate } = await import('../utils/autoSeed.js');
  await resetCleanSlate();
  res.status(200).json({ success: true, message: 'Database reset to clean slate.' });
});

export default router;
