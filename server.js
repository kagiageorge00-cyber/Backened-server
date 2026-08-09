const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const {
  createOfficeVisitBooking,
  getOfficeVisitBookings,
} = require('./services/officeVisitBookingService');
require('dotenv').config();

let helmet;
try {
  helmet = require('helmet');
} catch (error) {
  helmet = null;
}

const app = express();

const { FRONTEND_URL, BACKEND_URL } = require('./config');

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:52150',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:52150',
  'http://127.0.0.1:8080',
  'https://blissconnect12.netlify.app',
  'https://www.blissconnect12.netlify.app',
  'https://backened-server-1.onrender.com',
  'https://www.backened-server-1.onrender.com',
  process.env.FRONTEND_URL,
  FRONTEND_URL,
].filter(Boolean));

// ======================
// SECURITY MIDDLEWARE
// ======================
if (helmet) {
  app.use(helmet());
}
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.has(origin) ||
        /^(http|https):\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /\.netlify\.app$/i.test(origin) ||
        /\.onrender\.com$/i.test(origin)
      ) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
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
fs.mkdirSync(downloadsDir, { recursive: true });

const fallbackApkFileName = 'BlissConnect.apk';
const fallbackApkPath = path.join(downloadsDir, fallbackApkFileName);
if (!fs.existsSync(fallbackApkPath)) {
  fs.writeFileSync(
    fallbackApkPath,
    'Placeholder APK download. Replace this file with a real Android APK build before distributing the app.',
    'utf8'
  );
}

app.use('/downloads', express.static(downloadsDir));

app.get('/admin/whatsapp-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin_whatsapp_panel.html'));
});

app.get('/admin', (req, res) => {
  res.redirect('/admin/whatsapp-panel');
});

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
  const fileName = fallbackApkFileName;
  const filePath = path.join(downloadsDir, fileName);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      'Placeholder APK download. Replace this file with a real Android APK build before distributing the app.',
      'utf8'
    );
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
const Job = require('./models/Job');

// ======================
// PUBLIC LANDING ROUTES
// ======================
app.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOne({ jobId });
    if (!job) {
      return res.status(404).send('<h1>Job not found</h1>');
    }

    const title = job.jobTitle || job.title || 'Global Job Opportunity';
    const summary =
      job.jobSummary || job.description || 'Explore this opportunity on Bliss Connect.';
    const images = [job.coverImage, ...(job.images || [])].filter(Boolean);
    const previewImage = images[0] ||
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80';
    const shareUrl = `${BACKEND_URL}/jobs/${job.jobId}`;

    const imageMeta = images
      .slice(0, 3)
      .map((src) => `<meta property="og:image" content="${src}" />`)
      .join('\n    ');

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${summary.replace(/"/g, '&quot;')}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${summary.replace(/"/g, '&quot;')}" />
    <meta property="og:type" content="website" />
    ${imageMeta}
    <meta property="og:url" content="${shareUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${summary.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${previewImage}" />
    <meta name="robots" content="index,follow" />
    <style>
      body { font-family: Inter, system-ui, sans-serif; margin: 0; background: #050b1a; color: #f8fafc; }
      .page { display: grid; place-items: center; padding: 24px; }
      .preview-card { width: min(100%, 980px); border-radius: 30px; overflow: hidden; background: linear-gradient(180deg, rgba(10,25,63,0.95), rgba(7,17,31,0.98)); box-shadow: 0 30px 80px rgba(0,0,0,0.35); }
      .hero { position: relative; min-height: 420px; background: #0b1227; }
      .hero img { width: 100%; height: 420px; object-fit: cover; display: block; }
      .hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(7,17,31,0.92)); }
      .hero-label { position: absolute; left: 24px; bottom: 24px; z-index: 2; background: rgba(15, 23, 42, 0.82); color: #e2e8f0; padding: 10px 14px; border-radius: 999px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
      .thumbnails { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 18px 24px 0; background: #07111f; }
      .thumbnail { border-radius: 18px; overflow: hidden; background: #0a1221; aspect-ratio: 4/3; cursor: pointer; border: 2px solid transparent; }
      .thumbnail img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .thumbnail.active { border-color: #3b82f6; }
      .details { padding: 28px 32px 32px; display: grid; gap: 24px; }
      .brand-pill { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.08); color: #f8fafc; font-size: 12px; }
      .brand-pill::before { content: '★'; display: inline-block; color: #38bdf8; }
      .title { margin: 0; font-size: clamp(2rem, 2.5vw, 3rem); line-height: 1.05; }
      .meta { display: flex; flex-wrap: wrap; gap: 10px; color: #cbd5e1; font-size: 0.95rem; }
      .meta span { background: rgba(255,255,255,0.04); padding: 10px 14px; border-radius: 14px; }
      .summary { margin: 0; color: #e2e8f0; line-height: 1.8; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
      .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(148,163,184,0.12); border-radius: 22px; padding: 20px; }
      .card h3 { margin: 0 0 12px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd; }
      .card p, .card ul { margin: 0; color: #cbd5e1; font-size: 0.95rem; line-height: 1.7; }
      .card ul { padding-left: 18px; }
      .button-row { display: flex; flex-wrap: wrap; gap: 12px; }
      .button { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 18px; border-radius: 14px; text-decoration: none; color: #fff; font-weight: 600; }
      .button.primary { background: linear-gradient(135deg, #38bdf8, #3b82f6); }
      .button.secondary { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); }
      .footer { padding: 20px 32px 28px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; color: #94a3b8; font-size: 0.92rem; }
      @media (max-width: 760px) { .hero { min-height: 280px; } .thumbnails { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    </style>
  </head>
  <body>
    <div class="page">
      <article class="preview-card">
        <section class="hero">
          <img id="heroImage" src="${previewImage}" alt="${title}" />
          <div class="hero-label">Bliss Connect | Global Talent Marketplace</div>
        </section>
        <section class="thumbnails">
          ${images
            .slice(0, 3)
            .map(
              (src, index) => `
              <button class="thumbnail${index === 0 ? ' active' : ''}" data-src="${src}" type="button">
                <img src="${src}" alt="${title} photo ${index + 1}" />
              </button>
            `,
            )
            .join('')}
        </section>
        <div class="details">
          <div>
            <span class="brand-pill">Job preview</span>
            <h1 class="title">${title}</h1>
            <p class="meta">
              <span>${job.employerName || 'Company listing'}</span>
              <span>${job.city || job.location || 'Remote / Global'}</span>
              <span>${job.country || 'International'}</span>
              <span>${job.employmentType || 'Flexible'}</span>
            </p>
            <p class="summary">${summary}</p>
          </div>
          <div class="grid">
            <div class="card">
              <h3>Opportunity details</h3>
              <p>Salary: ${job.currency || 'USD'} ${job.salary || 'Negotiable'}</p>
              <p>Vacancies: ${job.numberOfVacancies || job.vacancies || 'Multiple'}</p>
              <p>Deadline: ${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Open'}</p>
            </div>
            <div class="card">
              <h3>What makes it strong</h3>
              <ul>
                <li>${job.jobSummary ? 'Clear role description' : 'High-demand global placement'}</li>
                <li>${job.requiredSkills?.length ? job.requiredSkills.slice(0, 3).join(', ') : 'Flexible skill set'}</li>
                <li>${job.workLocation || 'Flexible work mode'}</li>
              </ul>
            </div>
          </div>
          <div class="button-row">
            <a class="button primary" href="${shareUrl}">View this job on Bliss Connect</a>
            <a class="button secondary" href="mailto:?subject=${encodeURIComponent('Job opportunity: ' + title)}&body=${encodeURIComponent(summary + '\n\n View this role: ' + shareUrl)}">Email link</a>
          </div>
        </div>
        <footer class="footer">
          <span>Job ID: ${job.jobId}</span>
          <span>Shared via Bliss Connect</span>
        </footer>
      </article>
    </div>
    <script>
      const thumbnails = document.querySelectorAll('.thumbnail');
      const hero = document.getElementById('heroImage');
      thumbnails.forEach((button) => {
        button.addEventListener('click', () => {
          thumbnails.forEach((btn) => btn.classList.remove('active'));
          button.classList.add('active');
          hero.src = button.dataset.src;
        });
      });
    </script>
  </body>
</html>`;

    res.send(html);
  } catch (error) {
    console.error('Job page error:', error);
    return res.status(500).send('<h1>Server error</h1>');
  }
});

const candidateRoutes = require('./routes/candidateRoutes');
const applyRoutes = require('./routes/applyRoutes');
const registerRoutes = require('./routes/register');
const paymentRoutes = require('./routes/payment');
const paymentRoutesV2 = require('./routes/paymentRoutes');
const { router: uploadRoutes } = require('./routes/upload');
let adminRoutes;
try {
  adminRoutes = require('./routes/admin');
  if (!adminRoutes || typeof adminRoutes !== 'function') {
    throw new Error('Admin routes did not export a valid router');
  }
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
const localRecruitmentRoutes = require('./routes/localRecruitment');
const internationalRecruitmentRoutes = require('./routes/internationalRecruitment');
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
const messagesRoutes = require('./routes/messages');
const jobsRoutes = require('./routes/jobs');
const whatsappWebhookRoutes = require('./routes/whatsappWebhook');
const whatsappEmbeddedSignupRoutes = require('./routes/whatsappEmbeddedSignup');
const blissAuthRoutes = require('./routes/bliss_auth');
const modularAuthRoutes = require('./auth/routes/authRoutes');
const dashboardRoutes = require('./dashboard/routes/dashboardRoutes');
const inboxRoutes = require('./inbox/routes/inboxRoutes');
const agentsRoutes = require('./routes/agents');
const agentPortalRoutes = require('./routes/agentPortal');
const SocketManager = require('./inbox/socket/socketManager');
const travelRoutes = require('./routes/travelRoutes');
const staffPortalRoutes = require('./routes/staffPortal');
// Admin WhatsApp routes (campaign management)
let whatsappAdminRoutes;
let whatsappAdminAuth;
try {
  whatsappAdminRoutes = require('./routes/whatsappAdmin');
  const adminAuthModule = require('./middleware/adminAuth');
  whatsappAdminAuth = adminAuthModule.requireAdminAuth;

  if (!whatsappAdminRoutes || typeof whatsappAdminRoutes !== 'function') {
    throw new Error('WhatsApp admin routes did not export a valid router');
  }
  if (!whatsappAdminAuth || typeof whatsappAdminAuth !== 'function') {
    throw new Error('requireAdminAuth middleware is not available');
  }

  app.use('/api/admin/whatsapp', whatsappAdminAuth, whatsappAdminRoutes);
  console.log('✅ WhatsApp admin routes mounted at /api/admin/whatsapp');
} catch (err) {
  console.warn('⚠️ Whatsapp admin routes not mounted:', err.message);
  whatsappAdminRoutes = (req, res, next) => {
    res.status(500).json({ success: false, error: 'WhatsApp admin routes not available: ' + err.message });
  };
  whatsappAdminAuth = null;
}

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
app.use('/api/candidates', marketplaceRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/apply', applyRoutes);
app.use(['/api/register', '/api/candidate/register'], registerRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payments', paymentRoutesV2);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappWebhookRoutes);
app.use('/api/whatsapp', whatsappEmbeddedSignupRoutes);
app.use('/api/bliss-auth', blissAuthRoutes);
app.use('/api/auth', modularAuthRoutes);
app.use('/api', travelRoutes);
app.use('/api/staff', staffPortalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/agent-portal', agentPortalRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/shortlist', shortlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/deployments', deploymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/local-recruitment', localRecruitmentRoutes);
app.use('/api/international-recruitment', internationalRecruitmentRoutes);
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

app.get('/api/auth/health', (req, res) => {
  res.json({ success: true, message: 'Bliss authentication backend is live.' });
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

    const normalizedCandidateId = candidateId.toString().trim();
    const normalizedPhone = normalizePhone(normalizedCandidateId);
    const normalizedEmail = normalizedCandidateId.toLowerCase();
    const lookupCriteria = [
      { uniqueCode: normalizedCandidateId },
      { email: normalizedEmail },
    ];

    if (mongoose.Types.ObjectId.isValid(normalizedCandidateId)) {
      lookupCriteria.unshift({ _id: normalizedCandidateId });
    }

    if (normalizedPhone) {
      lookupCriteria.push({ phone: normalizedPhone });
      lookupCriteria.push({ phone: normalizedCandidateId });
    } else {
      lookupCriteria.push({ phone: normalizedCandidateId });
    }

    const candidate = await CandidateModel.findOne({ $or: lookupCriteria });
    if (!candidate) {
      return res.status(401).json({ success: false, error: 'Invalid ID or password' });
    }

    const match = await bcrypt.compare(password, candidate.password || '');
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid ID or password' });
    }

    res.json({ success: true, candidateId: candidate.uniqueCode, fullName: candidate.fullName || candidate.name || candidate.uniqueCode });
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
  const verifyTokenConfigured = Boolean(process.env.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
  res.json({
    success: true,
    status: 'ok',
    webhook: 'active',
    verifyTokenConfigured,
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
// OFFICE VISIT BOOKINGS
// ======================
app.post('/api/office-visit-bookings', async (req, res) => {
  try {
    const booking = await createOfficeVisitBooking(req.body);
    res.status(201).json({
      success: true,
      booking,
      id: booking._id.toString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Alias for legacy or alternate client endpoints
app.post('/api/office/apply', async (req, res) => {
  try {
    const booking = await createOfficeVisitBooking(req.body);
    res.status(201).json({
      success: true,
      booking,
      id: booking._id.toString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/office-visit-bookings', async (req, res) => {
  try {
    const bookings = await getOfficeVisitBookings();
    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/admin/office-visit-bookings', async (req, res) => {
  try {
    const bookings = await getOfficeVisitBookings();
    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
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
let httpServer;
let socketManager;

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

  httpServer = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  socketManager = new SocketManager(httpServer);
  logger.info('Socket.IO messaging backend initialized');
  try {
    const socketService = require('./inbox/socket/socketService');
    socketService.setSocketServer(socketManager.io);
    logger.info('Socket service connected');
  } catch (err) {
    logger.warn('Failed to attach socket service:', err.message || err);
  }
}

module.exports = app;

if (require.main === module) {
  startServer();
}

// ==========================
// Contract download endpoints
// ==========================
const jwt = require('jsonwebtoken');
const ContractModel = require('./models/Contract');

// Employer can request a short-lived download token for a contract
app.post('/api/contracts/:contractId/download-token', async (req, res) => {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.toString().startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Employer authorization required' });
    }
    const token = auth.toString().replace(/^Bearer\s+/i, '');
    const { verifyEmployerToken } = require('./services/jwtService');
    let decoded;
    try {
      decoded = verifyEmployerToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid employer token' });
    }

    const { contractId } = req.params;
    const contract = await ContractModel.findOne({ contractId });
    if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });
    if (contract.employerId !== decoded.employerId) return res.status(403).json({ success: false, error: 'Access denied' });

    const downloadSecret = process.env.DOWNLOAD_JWT_SECRET || process.env.JWT_SECRET || 'download_secret';
    const downloadToken = jwt.sign({ contractId }, downloadSecret, { expiresIn: '15m' });

    return res.json({ success: true, downloadToken, expiresIn: 15 * 60 });
  } catch (err) {
    console.error('Download token error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Public download route: accepts employer Authorization or ?token=
app.get('/api/contracts/download/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const downloadToken = req.query.token;
    const auth = req.headers.authorization || req.headers.Authorization;

    let allowed = false;

    // Check employer auth
    if (auth && auth.toString().startsWith('Bearer ')) {
      const token = auth.toString().replace(/^Bearer\s+/i, '');
      try {
        const { verifyEmployerToken } = require('./services/jwtService');
        const decoded = verifyEmployerToken(token);
        if (decoded && decoded.employerId) {
          const Contract = await ContractModel.findOne({ contractId });
          if (Contract && Contract.employerId === decoded.employerId) allowed = true;
        }
      } catch (err) {
        // ignore
      }
    }

    // Check download token
    if (!allowed && downloadToken) {
      try {
        const downloadSecret = process.env.DOWNLOAD_JWT_SECRET || process.env.JWT_SECRET || 'download_secret';
        const decoded = jwt.verify(downloadToken.toString(), downloadSecret);
        if (decoded && decoded.contractId === contractId) allowed = true;
      } catch (err) {
        // invalid token
      }
    }

    if (!allowed) return res.status(403).json({ success: false, error: 'Access denied' });

    const contract = await ContractModel.findOne({ contractId });
    if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });

    // Only allow download if both parties have signed (documents release condition)
    if (!(contract.employerSigned && contract.candidateSigned)) {
      return res.status(403).json({ success: false, error: 'Contract not yet fully signed' });
    }

    const filePath = path.join(__dirname, 'uploads', 'contracts', `${contractId}.pdf`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Contract PDF not found' });
    }

    return res.download(filePath, `${contractId}.pdf`);
  } catch (err) {
    console.error('Contract download error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
