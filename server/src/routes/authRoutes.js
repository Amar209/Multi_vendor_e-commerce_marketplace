import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);

// Reset database to fresh clean slate (in dev or when invoked)
router.post('/reset-clean', async (req, res) => {
  const { resetCleanSlate } = await import('../utils/autoSeed.js');
  await resetCleanSlate();
  res.status(200).json({ success: true, message: 'Database reset to clean slate.' });
});

export default router;
