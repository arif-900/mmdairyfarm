import { login } from '../_lib/controllers/adminController.js';
import cors from 'cors';

const corsMiddleware = cors();

export default async function handler(req, res) {
  // Manual CORS handling for simple Vercel function
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, async (result) => {
      if (result instanceof Error) return reject(result);
      
      console.log(`[LOGIN] Method: ${req.method}, Body present: ${!!req.body}`);

      if (req.method === 'POST') {
        try {
          if (!req.body || Object.keys(req.body).length === 0) {
             console.warn('[LOGIN] Empty body received');
          }
          await login(req, res);
          resolve();
        } catch (err) {
          console.error('[LOGIN CRASH]:', err);
          res.status(500).json({ 
            success: false, 
            error: 'Login Handler Crashed', 
            message: err.message,
            stack: err.stack 
          });
          resolve();
        }
      } else {
        res.status(405).json({ error: 'Method not allowed' });
        resolve();
      }
    });
  });
}
