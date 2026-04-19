import express from 'express';
import cors from 'cors';
import * as orderController from '../_lib/controllers/orderController.js';

const app = express();

app.use(cors());
app.use(express.json());

// Public order routes
app.post('/api/orders', orderController.createOrder);
app.patch('/api/orders/status', orderController.updateStatus);
app.get('/api/orders/abandoned', orderController.getAbandonedOrders);

export default app;
