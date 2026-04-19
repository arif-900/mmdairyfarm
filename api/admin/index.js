import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as adminController from '../_lib/controllers/adminController.js';
import { verifyAdmin } from '../_lib/middleware/authMiddleware.js';

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Public routes
app.post('/api/admin/login', adminController.login);

// Protected routes middleware
app.use(verifyAdmin);

// Dashboard & Analytics
app.get('/api/admin/dashboard', adminController.getDashboardStats);
app.get('/api/admin/analytics', adminController.getAnalytics);
app.get('/api/admin/logs', adminController.getLogs);

// Orders
app.get('/api/admin/orders', adminController.getOrders);
app.get('/api/admin/orders/:id', adminController.getOrderById);
app.patch('/api/admin/orders/:id/status', adminController.updateOrderStatus);

// Abandoned Carts
app.get('/api/admin/abandoned-orders', adminController.getAbandonedOrders);
app.post('/api/admin/resend-reminder/:id', adminController.resendReminder);

// Retries
app.get('/api/admin/retries', adminController.getRetries);
app.post('/api/admin/retry/:id', adminController.retryMessage);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

export default app;
