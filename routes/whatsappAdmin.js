/**
 * WhatsApp Admin Routes
 * Complete campaign management API endpoints
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const whatsappAdminController = require('../controllers/whatsappAdminController');

// Middleware for admin authentication
const adminAuth = (req, res, next) => {
  // TODO: Implement your JWT verification logic
  // For now, check if user has admin role
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

// Rate limiting
const contactImportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many import requests, please try again later',
});

const campaignLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please try again later',
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/whatsapp-imports'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Only allow CSV and Excel files
  const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// ============================================
// CONTACT MANAGEMENT ROUTES
// ============================================

/**
 * Import contacts from CSV/Excel
 * POST /admin/whatsapp/contacts/import
 */
router.post(
  '/contacts/import',
  adminAuth,
  contactImportLimiter,
  upload.single('file'),
  whatsappAdminController.importContacts
);

/**
 * Get all contacts (paginated)
 * GET /admin/whatsapp/contacts?page=1&limit=20&optedOut=false&tags=tag1
 */
router.get('/contacts', adminAuth, whatsappAdminController.getContacts);

/**
 * Get contact statistics
 * GET /admin/whatsapp/contacts/statistics
 */
router.get('/contacts/statistics', adminAuth, whatsappAdminController.getContactStatistics);

/**
 * Deduplicate contacts
 * POST /admin/whatsapp/contacts/deduplicate
 */
router.post('/contacts/deduplicate', adminAuth, whatsappAdminController.deduplicateContacts);

/**
 * Add tags to multiple contacts
 * POST /admin/whatsapp/contacts/add-tags
 * Body: { contactIds: [...], tags: [...] }
 */
router.post('/contacts/add-tags', adminAuth, campaignLimiter, whatsappAdminController.addTagsToContacts);

// ============================================
// CAMPAIGN MANAGEMENT ROUTES
// ============================================

/**
 * Create new campaign
 * POST /admin/whatsapp/campaigns
 * Body: { name, message, templateName, templateParameters, audienceTags, sendMode, scheduledAt }
 */
router.post('/campaigns', adminAuth, campaignLimiter, whatsappAdminController.createCampaign);

/**
 * Get all campaigns
 * GET /admin/whatsapp/campaigns?page=1&limit=10&status=draft
 */
router.get('/campaigns', adminAuth, whatsappAdminController.getCampaigns);

/**
 * Get campaign by ID
 * GET /admin/whatsapp/campaigns/:campaignId
 */
router.get('/campaigns/:campaignId', adminAuth, whatsappAdminController.getCampaignById);

/**
 * Update campaign
 * PATCH /admin/whatsapp/campaigns/:campaignId
 */
router.patch('/campaigns/:campaignId', adminAuth, campaignLimiter, whatsappAdminController.updateCampaign);

/**
 * Queue campaign (prepare for sending)
 * POST /admin/whatsapp/campaigns/:campaignId/queue
 */
router.post('/campaigns/:campaignId/queue', adminAuth, campaignLimiter, whatsappAdminController.queueCampaign);

/**
 * Launch campaign (start sending)
 * POST /admin/whatsapp/campaigns/:campaignId/launch
 */
router.post('/campaigns/:campaignId/launch', adminAuth, campaignLimiter, whatsappAdminController.launchCampaign);

/**
 * Pause campaign
 * POST /admin/whatsapp/campaigns/:campaignId/pause
 */
router.post('/campaigns/:campaignId/pause', adminAuth, campaignLimiter, whatsappAdminController.pauseCampaign);

/**
 * Resume paused campaign
 * POST /admin/whatsapp/campaigns/:campaignId/resume
 */
router.post('/campaigns/:campaignId/resume', adminAuth, campaignLimiter, whatsappAdminController.resumeCampaign);

/**
 * Delete campaign
 * DELETE /admin/whatsapp/campaigns/:campaignId
 */
router.delete('/campaigns/:campaignId', adminAuth, campaignLimiter, whatsappAdminController.deleteCampaign);

/**
 * Get campaign statistics
 * GET /admin/whatsapp/campaigns/:campaignId/statistics
 */
router.get('/campaigns/:campaignId/statistics', adminAuth, whatsappAdminController.getCampaignStatistics);

// ============================================
// ANALYTICS & DASHBOARD ROUTES
// ============================================

/**
 * Get dashboard statistics
 * GET /admin/whatsapp/statistics/dashboard
 */
router.get('/statistics/dashboard', adminAuth, whatsappAdminController.getDashboardStatistics);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB',
      });
    }
  }

  if (error && error.message) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  next(error);
});

module.exports = router;
