import express from 'express';
import cors from 'cors';
import * as orderController from '../_lib/controllers/orderController.js';
import { verifySupabaseUser } from '../_lib/middleware/supabaseAuthMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// Protected order status update route (requires Supabase JWT verification)
app.patch('/api/orders/status', verifySupabaseUser, orderController.updateStatus);

export default app;
