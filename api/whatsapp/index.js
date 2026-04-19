// api/whatsapp/index.js
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.all('/api/whatsapp', (req, res) => {
  return res.status(200).json({
    status: "ready",
    service: "WhatsApp Notification Gateway",
    usage: "POST here with template names and customer phone numbers to send automated alerts.",
    contact: "+91 63098 35752"
  });
});

export default app;
