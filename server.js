const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// STATIC FILES
// ======================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================
// MODELS
// ======================
const Candidate = require('./models/candidate');
const User = require('./models/User');

// ======================
// ROUTES
// (MATCHES YOUR ACTUAL FILES)
// ======================
const candidateRoutes = require('./routes/candidateRoutes');
const applyRoutes = require('./routes/applyRoutes');
const registerRoutes = require('./routes/register');
const paymentRoutes = require('./routes/payment');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const submitPaymentsRoutes = require('./routes/submitpayments');
const submitPaymentsLegacy = require('./submitpayments');
const CandidateModel = require('./models/candidate');
const bcrypt = require('bcryptjs');

// Gracefully handle flightSearch module (may not exist in all deployments)
let flightSearch;
try {
  flightSearch = require('../functions/flightSearch');
} catch (err) {
  // Fallback stub if functions directory is not available
  flightSearch = {
    searchFlights: async () => []
  };
}

// ======================
// API ROUTES
// ======================
app.use('/api', submitPaymentsLegacy);
app.use('/api/candidates', candidateRoutes);
app.use('/api/apply', applyRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/candidate', registerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/submitpayments', submitPaymentsRoutes);

app.post('/register', async (req, res) => {
  const { name, email, phone, userType } = req.body;
  if (!name || !email || !phone || !userType) {
    return res.status(400).json({ success: false, error: 'name, email, phone and userType are required' });
  }

  return res.json({
    success: true,
    user: { name, email, phone, userType }
  });
});

app.post('/payment', async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || amount == null) {
    return res.status(400).json({ success: false, error: 'userId and amount are required' });
  }

  return res.json({
    success: true,
    transactionId: `TX_${Date.now()}`
  });
});

app.post('/flightSearch', async (req, res) => {
  try {
    const { origin, destination, date } = req.body;
    if (!origin || !destination || !date) {
      return res.status(400).json({ success: false, error: 'origin, destination and date are required' });
    }

    try {
      const flights = await flightSearch.searchFlights(origin, destination, date);
      return res.json({ success: true, flights: Array.isArray(flights) ? flights : [] });
    } catch (error) {
      console.warn('Flight search fallback:', error.message);
      return res.json({ success: true, flights: [] });
    }
  } catch (err) {
    console.error('Flight search error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/candidate/login', async (req, res) => {
  try {
    const { candidateId, password } = req.body;
    if (!candidateId || !password) {
      return res.status(400).json({ success: false, error: 'candidateId and password are required' });
    }

    const candidate = await CandidateModel.findOne({ uniqueCode: candidateId });
    if (!candidate) {
      return res.status(401).json({ success: false, error: 'Invalid ID or password' });
    }

    const match = await bcrypt.compare(password, candidate.password || '');
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid ID or password' });
    }

    res.json({ success: true, candidateId: candidate.uniqueCode, fullName: candidate.fullName });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// HEALTH CHECK
// ======================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bliss Backend Running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok'
  });
});

// ======================
// MEDICAL BOOKINGS
// ======================
const medicalSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    fullName: String,
    phone: String,
    idNumber: String,
    gender: String,
    dateOfBirth: String,
    paymentStatus: {
      type: String,
      default: 'pending_verification'
    },
    bookingStatus: {
      type: String,
      default: 'pending'
    }
  },
  { timestamps: true }
);

const Medical = mongoose.model('Medical', medicalSchema);

app.post('/api/medical/book', async (req, res) => {
  try {
    const booking = await Medical.create(req.body);

    res.status(201).json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ======================
// VIDEO UPLOAD
// ======================
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },

  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post(
  '/api/upload/video/:userId',
  upload.single('video'),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.videoUrl = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({
        success: true,
        user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// ======================
// MARKETPLACE
// ======================
app.get('/api/marketplace', async (req, res) => {
  try {
    const candidates = await Candidate.find();

    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ======================
// 404
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// ======================
// DATABASE + SERVER
// ======================
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI missing');
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ MongoDB Connected');

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Startup Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;

if (require.main === module) {
  startServer();
}
