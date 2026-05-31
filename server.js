const express = require('express');
const app = express();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// ======================
// MODELS
// ======================
const Candidate = require('./models/candidate');
const User = require('./models/User');
const Payment = require('./models/Payment');

// ======================
// ROUTES (ALL YOUR FILES)
// ======================
const candidateRoutes = require('./routes/candidateRoutes');
const applyRoutes = require('./routes/applyRoutes');
const registerRoutes = require("./routes/register");
const paymentRoutes = require('./routes/paymentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// STATIC FILES (uploads)
// ======================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================
// SIMPLE NOTIFICATION
// ======================
const sendNotification = async (user, message) => {
  console.log(`📩 ${user.phone}: ${message}`);
};

// ======================
// ROUTE INIT (IMPORTANT)
// ======================
app.use('/api/candidates', candidateRoutes);
app.use('/api/apply', applyRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// ======================
// 🔥 JOB APPLICATION PAYMENTS (IN-MEMORY)
// ======================
const jobApplicationPayments = {};

// SUBMIT PAYMENT
app.post('/api/job-application-payments', (req, res) => {
  try {
    const {
      paymentId,
      candidateId,
      fullName,
      phoneNumber,
      transactionCode,
      amount,
      currency
    } = req.body;

    if (!paymentId || !candidateId || !transactionCode) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    // prevent duplicate transaction
    const exists = Object.values(jobApplicationPayments).find(
      p => p.transactionCode === transactionCode
    );

    if (exists) {
      return res.status(409).json({ success: false, error: 'Duplicate transaction' });
    }

    jobApplicationPayments[paymentId] = {
      paymentId,
      candidateId,
      fullName,
      phoneNumber,
      transactionCode,
      amount,
      currency,
      status: 'pending',
      createdAt: new Date()
    };

    res.json({ success: true, data: jobApplicationPayments[paymentId] });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// APPROVE PAYMENT
app.post('/api/admin/payments/:id/approve', async (req, res) => {
  try {
    const payment = jobApplicationPayments[req.params.id];

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    payment.status = 'verified';

    const user = await User.findOne({ phone: payment.phoneNumber });

    if (user) {
      await sendNotification(user, 'Payment approved ✅');
    }

    res.json({ success: true, payment });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// 🏥 MEDICAL BOOKING
// ======================
const medicalSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  fullName: String,
  phone: String,
  idNumber: String,
  gender: String,
  dateOfBirth: String,
  paymentStatus: { type: String, default: 'pending_verification' },
  bookingStatus: { type: String, default: 'pending' }
}, { timestamps: true });

const Medical = mongoose.model('Medical', medicalSchema);

// BOOK MEDICAL
app.post('/api/medical/book', async (req, res) => {
  try {
    const booking = await Medical.create(req.body);

    const user = await User.findById(req.body.userId);
    if (user) {
      await sendNotification(user, 'Medical booking received 🏥');
    }

    res.json({ success: true, booking });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// 🎥 VIDEO UPLOAD
// ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads';
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '.mp4');
  }
});

const upload = multer({ storage });

// UPLOAD VIDEO
app.post('/api/upload/video/:userId', upload.single('video'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.videoUrl = `/uploads/${req.file.filename}`;
    user.videoStatus = 'pending_review';

    await user.save();

    res.json({ success: true, user });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// 👤 REGISTER USER
// ======================
app.post('/register', async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(409).json({ success: false, error: 'User exists' });
    }

    const user = await User.create({
      ...req.body,
      userType: req.body.userType || 'candidate'
    });

    await sendNotification(user, 'Welcome to Bliss Connect 🎉');

    res.json({ success: true, user });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// 🌍 MARKETPLACE
// ======================
app.get('/api/marketplace', async (req, res) => {
  try {
    const data = await Candidate.find({
      isVerified: true,
      status: 'available'
    });

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// HEALTH
// ======================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ======================
// 404
// ======================
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// ======================
// START SERVER
// ======================
const startServer = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI missing');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ DB error:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;