const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const submitPaymentsLegacy = require('./submitpayments');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function startServer() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bliss_dev';
    console.log(`🔌 Connecting to MongoDB at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB Connected');

    // Mount admin and payment submission routes
    app.use('/api', submitPaymentsLegacy);
    app.use('/api/submitpayments', submitPaymentsLegacy);
    app.use('/api/admin', adminRoutes);

    app.get('/', (req, res) => {
      res.json({ success: true, message: 'Dev backend running (admin and payment routes mounted)' });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Dev backend running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('📌 Make sure MongoDB is running: mongod');
    process.exit(1);
  }
}

startServer();
