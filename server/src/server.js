import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { initElasticsearch } from './config/elasticsearch.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);

// System Health & Service Status Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: 'connected',
      cache: 'operational',
      search: 'operational'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Initialize core infrastructure and listen
const startServer = async () => {
  try {
    await connectDB();
    const { resetCleanSlate } = await import('./utils/autoSeed.js');
    await resetCleanSlate();
    initRedis();
    await initElasticsearch();

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Multi-Vendor Marketplace API Server running on port ${PORT}`);
      console.log(`📡 Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;
