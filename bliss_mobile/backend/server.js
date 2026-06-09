const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();

const { FRONTEND_URL } = require('./config');

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
let adminRoutes;
try {
  adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes loaded successfully');
} catch (err) {
  console.error('❌ ERROR loading admin routes:', err.message);
  adminRoutes = (req, res, next) => {
    res.status(500).json({ success: false, error: 'Admin routes not available: ' + err.message });
  };
}
const submitPaymentsRoutes = require('./routes/submitpayments');
const submitPaymentsLegacy = require('./submitpayments');
const employerRoutes = require('./routes/employers');
const CandidateModel = require('./models/candidate');
const bcrypt = require('bcryptjs');
const marketplaceRoutes = require('./routes/marketplace');
const interviewsRoutes = require('./routes/interviews');
const shortlistRoutes = require('./routes/shortlist');
const chatRoutes = require('./routes/chat');
const deploymentsRoutes = require('./routes/deployments');
const notificationsRoutes = require('./routes/notifications');
const contractsRoutes = require('./routes/contracts');
const adminStatsRoutes = require('./routes/adminStats');

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
app.use('/api/employers', employerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', submitPaymentsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/shortlist', shortlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/deployments', deploymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
// debug routes removed

// ======================
// TEST ENDPOINT FOR ADMIN ROUTES
// ======================
app.get('/api/admin/health', (req, res) => {
  res.json({ success: true, message: 'Admin routes working ✅' });
});

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

// ======================
// CANDIDATE FORM - GET DATA FOR FRONTEND
// ======================
app.get('/api/candidate-form/data', async (req, res) => {
  try {
    const { candidateId, phone } = req.query;
    if (!candidateId && !phone) {
      return res.status(400).json({ success: false, error: 'candidateId or phone query parameter required' });
    }

    let candidate;
    if (phone) {
      candidate = await CandidateModel.findOne({ phone: phone });
    } else {
      candidate = await CandidateModel.findOne({
        $or: [
          { _id: candidateId },
          { uniqueCode: candidateId },
          { phone: candidateId },
          { email: candidateId }
        ]
      });
    }

    // ✅ RETURN SUCCESS EVEN IF CANDIDATE NOT FOUND
    if (!candidate) {
      return res.status(200).json({
        success: true,
        candidateExists: false,
        data: {
          phone: phone || candidateId || ''
        }
      });
    }

    return res.status(200).json({
      success: true,
      candidateExists: true,
      data: candidate,
      isVerified: candidate.isVerified,
      paymentStatus: candidate.paymentStatus
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ======================
// PAYMENT SUCCESS REDIRECT
// ======================
app.get('/api/payment-success/:candidateId', async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    
    let candidate = await CandidateModel.findOne({
      $or: [
        { _id: candidateId },
        { uniqueCode: candidateId },
        { phone: candidateId }
      ]
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const candidateFormLink = `${FRONTEND_URL}/candidate-form?candidateId=${candidateId}`;

    return res.status(200).json({
      success: true,
      message: 'Payment verified, please complete your form',
      candidateId,
      formLink: candidateFormLink,
      candidate: {
        name: candidate.fullName || candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        isVerified: candidate.isVerified
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
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

app.post('/api/interviews/request', async (req, res) => {
  try {
    const { employerId, candidateId, scheduledAt, notes } = req.body;
    if (!employerId || !candidateId || !scheduledAt) {
      return res.status(400).json({ success: false, error: 'employerId, candidateId and scheduledAt are required' });
    }

    const Interview = require('./models/Interview');
    const Notification = require('./models/Notification');
    const Employer = require('./models/Employer');

    const employer = await Employer.findOne({ $or: [{ _id: employerId }, { employerId: employerId }] });

    const interviewId = `intv_${Date.now()}`;
    const interviewDate = new Date(scheduledAt);

    const interview = await Interview.create({
      interviewId,
      employerId,
      candidateId,
      interviewDate,
      interviewTime: interviewDate.toISOString(),
      notes: notes || '',
      interviewStatus: 'requested'
    });

    const title = 'New Interview Request';
    const message = `${(employer && (employer.companyName || employer.name)) || 'An employer'} would like to interview you.`;

    await Notification.create({
      notificationId: `ntf_${Date.now()}`,
      userId: candidateId,
      userType: 'candidate',
      title,
      message,
      notificationType: 'interview',
      actionUrl: `/candidate/interview/${interviewId}`
    });

    return res.status(201).json({ success: true, interviewId, interview });
  } catch (error) {
    console.error('Interview request error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
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
  // Log unmatched requests to help debug 404s from clients
  console.log('[404] Unmatched request:', req.method, req.originalUrl, 'headers:', req.headers && Object.keys(req.headers).length);
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

module.exports = app;

if (require.main === module) {
  startServer();
}
