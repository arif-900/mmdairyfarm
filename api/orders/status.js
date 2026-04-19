import { updateStatus } from '../_lib/controllers/orderController.js';
import cors from 'cors';

const corsMiddleware = cors();

export default async function handler(req, res) {
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, async (result) => {
      if (result instanceof Error) return reject(result);
      
      if (req.method === 'PATCH') {
        try {
          await updateStatus(req, res);
          resolve();
        } catch (err) {
          console.error('Status Update Error:', err);
          res.status(500).json({ error: 'Internal Server Error', message: err.message });
          resolve();
        }
      } else {
        res.status(405).json({ error: 'Method not allowed' });
        resolve();
      }
    });
  });
}
