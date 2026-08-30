import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import your API handlers
import ordersApp from './api/orders/index.js';
import adminApp from './api/admin/index.js';
import chatApp from './api/chat/index.js';
import whatsappApp from './api/whatsapp/index.js';
import rankHandler from './api/recommendations/rank.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Mount API handlers (they handle their own /api/xxx paths)
app.use(ordersApp);
app.use(adminApp);
app.use(chatApp);
app.use(whatsappApp);
app.post('/api/recommendations/rank', rankHandler);

// Root route for health check
app.get('/', (req, res) => {
  res.send('Dairy Farm API Server is running on port 5001');
});

app.listen(PORT, () => {
  console.log(`
  🚀 API Server ready 
  ------------------------------
  Local: http://localhost:${PORT}
  Orders:   http://localhost:${PORT}/api/orders
  Admin:    http://localhost:${PORT}/api/admin
  AI Chat:  http://localhost:${PORT}/api/chat
  WhatsApp: http://localhost:${PORT}/api/whatsapp
  ------------------------------
  Wait for Vite to proxy requests to this server.

  🥛 Unified Backend Ready!
  `);
});
