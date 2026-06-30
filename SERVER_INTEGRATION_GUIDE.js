/**
 * Server Integration Guide - WhatsApp Campaign Management
 * 
 * This file shows how to integrate the WhatsApp Campaign Management module
 * into your existing Express server.
 * 
 * Add this to your server.js or app.js file
 */

// ============================================
// EXAMPLE: Complete Integration into server.js
// ============================================

// At the top with other requires
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import WhatsApp routes
const whatsappAdminRoutes = require('./routes/whatsappAdmin');
const whatsappWebhookRoutes = require('./routes/whatsappWebhook');

// Middleware
const { jwtAuth } = require('./middleware/jwtAuth'); // Your existing JWT middleware
const { adminAuth } = require('./middleware/adminAuth'); // Create this if needed

const app = express();

// ============================================
// STANDARD MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// UPLOAD DIRECTORY SETUP
// ============================================
// Ensure uploads directories exist
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads/whatsapp-imports');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Serve uploads as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
const jwtMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No authorization token provided',
    });
  }
  
  try {
    // Your existing JWT verification logic
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

/**
 * Admin Authorization Middleware
 * Checks if user has admin role
 */
const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }
  next();
};

// ============================================
// DATABASE CONNECTION
// ============================================
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// ============================================
// WHATSAPP CAMPAIGN ROUTES REGISTRATION
// ============================================

/**
 * IMPORTANT: Route registration order matters!
 * Webhook route must NOT require auth (public endpoint)
 * Admin routes require authentication
 */

// Public webhook endpoint (no auth required)
// Must be registered BEFORE auth middleware
app.use('/api/whatsapp', whatsappWebhookRoutes);

// Admin routes (auth required)
// Register with JWT + admin middleware
app.use(
  '/api/admin/whatsapp',
  jwtMiddleware,      // Verify JWT token
  adminMiddleware,    // Check admin role
  whatsappAdminRoutes // Campaign management routes
);

// ============================================
// EXISTING ROUTES (Your other routes)
// ============================================
// app.use('/api/auth', authRoutes);
// app.use('/api/candidates', candidateRoutes);
// ... etc ...

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error'
      : err.message,
  });
});

// ============================================
// SERVER STARTUP
// ============================================
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 WhatsApp Webhook: http://localhost:${PORT}/api/whatsapp/webhook`);
      console.log(`🎯 Admin API: http://localhost:${PORT}/api/admin/whatsapp/campaigns`);
      console.log(`📖 Documentation: See WHATSAPP_CAMPAIGN_GUIDE.md`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

module.exports = app;

/**
 * ============================================
 * QUEUE WORKER SETUP (Separate File)
 * ============================================
 * 
 * Create workers/whatsappQueueWorker.js
 * 
 * Run separately:
 * node workers/whatsappQueueWorker.js
 */

// ============================================
// ALTERNATIVE: Route Organization Pattern
// ============================================

/**
 * If you prefer more modular route organization,
 * you can structure like this:
 */

// routes/index.js
module.exports = function registerRoutes(app, middleware) {
  
  // Public routes (no auth)
  app.use('/api/whatsapp', require('./whatsappWebhook'));
  
  // Admin routes (with auth)
  app.use(
    '/api/admin',
    middleware.jwtAuth,
    middleware.adminAuth,
    require('./admin')
  );
};

// routes/admin/index.js
const router = require('express').Router();

router.use('/whatsapp', require('./whatsappAdmin'));
// Add other admin routes here

module.exports = router;

// In server.js
// const registerRoutes = require('./routes');
// registerRoutes(app, { jwtAuth: jwtMiddleware, adminAuth: adminMiddleware });

// ============================================
// ENVIRONMENT VARIABLES CHECKLIST
// ============================================

/**
 * Required in .env file:
 * 
 * # WhatsApp Configuration
 * WHATSAPP_PHONE_NUMBER_ID=682624514934414
 * WHATSAPP_WABA_ID=<your_waba_id>
 * WHATSAPP_ACCESS_TOKEN=<your_access_token>
 * WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_random_token
 * 
 * # Redis Configuration
 * REDIS_HOST=localhost
 * REDIS_PORT=6379
 * REDIS_PASSWORD=optional_password
 * 
 * # Database
 * MONGODB_URI=mongodb://localhost:27017/bliss
 * 
 * # JWT
 * JWT_SECRET=your_jwt_secret_key
 * 
 * # Server
 * PORT=3000
 * NODE_ENV=development
 */

// ============================================
// WEBHOOK CONFIGURATION IN WHATSAPP BUSINESS
// ============================================

/**
 * 1. Go to Meta for Developers
 * 2. Select your WhatsApp Business Account
 * 3. Go to Configuration > Webhooks
 * 4. Set Webhook URL to: https://yourdomain.com/api/whatsapp/webhook
 * 5. Set Verify Token to: your_secure_random_token (from .env)
 * 6. Subscribe to these webhook fields:
 *    - messages
 *    - message_status
 *    - message_template_status_update
 * 7. Click "Verify and Save"
 */

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================

/**
 * Run these once to create indexes:
 * 
 * db.whatsappcontacts.createIndex({ phoneNumber: 1 }, { unique: true })
 * db.whatsappcontacts.createIndex({ tags: 1 })
 * db.whatsappcontacts.createIndex({ optedOut: 1 })
 * db.whatsappcontacts.createIndex({ createdAt: -1 })
 * 
 * db.whatsappcampaigns.createIndex({ status: 1 })
 * db.whatsappcampaigns.createIndex({ createdAt: -1 })
 * 
 * db.whatsappqueues.createIndex({ campaignId: 1, status: 1 })
 * db.whatsappqueues.createIndex({ phoneNumber: 1 })
 * db.whatsappqueues.createIndex({ status: 1, nextRetryAt: 1 })
 * 
 * db.whatsappmessagelogs.createIndex({ phoneNumber: 1 })
 * db.whatsappmessagelogs.createIndex({ campaignId: 1 })
 * db.whatsappmessagelogs.createIndex({ createdAt: -1 })
 * 
 * db.whatsappoptouts.createIndex({ phoneNumber: 1 }, { unique: true })
 * db.whatsappoptouts.createIndex({ optOutReason: 1 })
 */
