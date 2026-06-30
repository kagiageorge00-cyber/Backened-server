require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const whatsappRouter = require('./routes/whatsapp');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 4001;

// Connect MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bliss_whatsapp';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error', err));

// Routes
app.use('/api/whatsapp', whatsappRouter);

// Webhook endpoint (must be publicly reachable)
app.get('/', (req, res) => res.send('WhatsApp Embedded Signup Service'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`WhatsApp service listening on port ${PORT}`);
});
