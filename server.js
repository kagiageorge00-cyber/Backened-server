const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
require('dotenv').config();

let helmet;
try {
  helmet = require('helmet');
} catch (error) {
  helmet = null;
}

const app = express();

const { FRONTEND_URL } = require('./config');

// ======================
// SECURITY MIDDLEWARE
// ======================
if (helmet) {
  app.use(helmet());
}
app.use(
  cors({
    origin: process.env.FRONTEND_URL || FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
});
app.use(defaultLimiter);

const rawBodySaver = (req, res, buf) => {
  if (buf && buf.length) {
    req.rawBody = buf;
  }
};

app.use(express.json({ verify: rawBodySaver }));
app.use(express.urlencoded({ extended: true, verify: rawBodySaver }));

// ======================
// STATIC FILES
// ======================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const downloadsDir = path.join(__dirname, 'downloads');
app.use('/downloads', express.static(downloadsDir));

// -----------------------------
// IMAGE PROXY (adds CORS)
// -----------------------------
const https = require('https');
app.get('/api/image-proxy', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'url query param required' });

  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return res.status(400).json({ success: false, error: 'invalid url' });
  }

  // Basic allowlist - extend if you trust other hosts
  const allowedHosts = ['res.cloudinary.com', 'cloudinary.com', 'i.imgur.com', 'example.com'];
  if (!allowedHosts.includes(parsed.hostname)) {
    return res.status(403).json({ success: false, error: 'host not allowed' });
  }

  // Stream the remote resource
  https.get(url, (proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    proxyRes.pipe(res);
  }).on('error', (err) => {
    console.error('image-proxy error:', err.message);
    res.status(502).json({ success: false, error: 'Failed to fetch image' });
  });
});

app.get('/api/downloads/latest', (req, res) => {
  const fileName = 'BlissConnect.apk';
  const filePath = path.join(downloadsDir, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error:
        'APK not available. Place BlissConnect.apk in backend/downloads to enable direct download.',
    });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const downloadUrl = `${protocol}://${host}/downloads/${fileName}`;

  return res.json({
    success: true,
    fileName,
    downloadUrl,
    message: 'Download the latest Bliss Connect Android APK from the backend.',
  });
});

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
const candidateApiRoutes = require('./routes/candidate_api');
const whatsappWebhookRoutes = require('./routes/whatsappWebhook');

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
app.use('/api/candidates', candidateRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/apply', applyRoutes);
app.use(['/api/register', '/api/candidate/register'], registerRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappWebhookRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/shortlist', shortlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/deployments', deploymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api', submitPaymentsRoutes);
// Mount updated submit-payments routes before legacy submitpayments fallback.
app.use('/api', submitPaymentsLegacy);
app.use('/api/candidate_portal', candidateApiRoutes);
app.use('/api/candidate/v2', candidateApiRoutes);
// debug routes removed

// ======================
// TEST ENDPOINT FOR ADMIN ROUTES
// ======================
app.get('/api/admin/health', (req, res) => {
  res.json({ success: true, message: 'Admin routes working ✅' });
});
// legacy submitpayments fallback remains last to avoid overriding active /api/submitPayment routes

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
function normalizePhone(rawPhone) {
  if (!rawPhone) return rawPhone;
  return rawPhone.toString().replace(/[^+0-9]/g, '').trim();
}

function cleanupCandidateId(rawCandidateId) {
  if (!rawCandidateId) return rawCandidateId;
  let value = rawCandidateId.toString();
  // Remove any trailing paths or fragment-like segments
  value = value.replace(/\/candidate-form.*$/i, '');
  value = value.replace(/^#+/, '');
  return normalizePhone(value) || value;
}

app.get('/api/candidate-form/data', async (req, res) => {
  try {
    const { candidateId, phone } = req.query;
    if (!candidateId && !phone) {
      return res.status(400).json({ success: false, error: 'candidateId or phone query parameter required' });
    }

    const normalizedPhone = normalizePhone(phone);
    const cleanedCandidateId = cleanupCandidateId(candidateId);

    let candidate;
    if (phone) {
      candidate = await CandidateModel.findOne({
        $or: [
          { phone },
          { phone: normalizedPhone },
          { uniqueCode: phone },
          { email: phone }
        ]
      });
    } else {
      const searchCriteria = [
        { uniqueCode: candidateId },
        { phone: candidateId },
        { email: candidateId }
      ];
      if (mongoose.Types.ObjectId.isValid(candidateId)) {
        searchCriteria.unshift({ _id: candidateId });
      }
      if (cleanedCandidateId && cleanedCandidateId !== candidateId) {
        searchCriteria.push({ phone: cleanedCandidateId });
        searchCriteria.push({ uniqueCode: cleanedCandidateId });
      }
      candidate = await CandidateModel.findOne({ $or: searchCriteria });
    }

    const lookupSource = phone ? 'phone' : 'candidateId';
    const lookupValue = phone || candidateId;

    // ✅ RETURN SUCCESS EVEN IF CANDIDATE NOT FOUND
    if (!candidate) {
      return res.status(200).json({
        success: true,
        candidateExists: false,
        lookup: {
          by: lookupSource,
          value: lookupValue
        },
        candidateId: null,
        phone: phone || candidateId || '',
        data: null
      });
    }

    const candidateData = candidate.toObject ? candidate.toObject() : candidate;
    candidateData.candidateId = candidate.uniqueCode;
    candidateData.id = candidate.uniqueCode;

    return res.status(200).json({
      success: true,
      candidateExists: true,
      lookup: {
        by: lookupSource,
        value: lookupValue
      },
      candidateId: candidate.uniqueCode,
      phone: candidate.phone,
      data: candidateData,
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
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/ready', async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    res.json({
      success: true,
      status: mongoState === 1 ? 'ready' : 'connecting',
      mongoReadyState: mongoState,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
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
// ERROR HANDLING
// ======================
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ Invalid JSON payload received:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload',
      details: err.message,
    });
  }

  console.error('❌ Unexpected server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server error',
  });
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
  const PORT = process.env.PORT || 3000;

  try {
    if (!process.env.MONGO_URI) {
      console.warn('⚠️ MONGO_URI missing; continuing without MongoDB');
    } else {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info('MongoDB Connected');
    }
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed; continuing without database:', error.message);
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;

if (require.main === module) {
  startServer();
}
