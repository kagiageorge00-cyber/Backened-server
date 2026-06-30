/**
 * WhatsApp Campaign Management Controller
 * Handles HTTP requests for campaign operations
 */

const contactService = require('../services/whatsappContactService');
const campaignService = require('../services/whatsappCampaignService');
const { messageQueue } = require('../services/whatsappQueueService');
const WhatsAppImportHistory = require('../models/WhatsAppImportHistory');
const Papa = require('papaparse');
const fs = require('fs');

/**
 * Import contacts from CSV/Excel
 * POST /admin/whatsapp/contacts/import
 */
async function importContacts(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileType = req.file.originalname.toLowerCase().includes('.xlsx') ? 'xlsx' : 'csv';
    const tags = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [];
    const importName = req.body.importName || `Import ${new Date().toISOString()}`;

    // Create import history record
    const importHistory = new WhatsAppImportHistory({
      importName,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType,
      status: 'processing',
      appliedTags: tags,
      importedBy: req.user?.email || 'admin',
      startedAt: new Date(),
    });

    try {
      let contacts = [];

      if (fileType === 'csv') {
        // Parse CSV
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        const parseResult = Papa.parse(fileContent, { header: true });
        contacts = parseResult.data.filter(row => row.phone_number); // Filter empty rows
      } else {
        // For Excel, use existing logic or a library like xlsx
        // For now, we'll handle CSV
        throw new Error('Excel import requires xlsx library - currently CSV only');
      }

      // Bulk import
      const importResult = await contactService.bulkImportContacts(contacts, tags);

      // Update import history
      importHistory.totalRecords = importResult.total;
      importHistory.successfulImports = importResult.successful;
      importHistory.duplicatesSkipped = importResult.duplicates;
      importHistory.invalidRecords = importResult.invalid;
      importHistory.newContactsCreated = importResult.newContactsCreated;
      importHistory.existingContactsUpdated = importResult.existingUpdated;
      importHistory.errors = importResult.errors;
      importHistory.status = importResult.invalid > 0 ? 'partial' : 'completed';
      importHistory.completedAt = new Date();

      await importHistory.save();

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: 'Contacts imported successfully',
        data: {
          importId: importHistory._id,
          ...importResult,
        },
      });
    } catch (error) {
      importHistory.status = 'failed';
      importHistory.completedAt = new Date();
      importHistory.errors = [{ reason: error.message }];
      await importHistory.save();

      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get all contacts
 * GET /admin/whatsapp/contacts
 */
async function getContacts(req, res) {
  try {
    const { page = 1, limit = 20, optedOut, search, tags } = req.query;

    let filter = {};
    if (optedOut === 'true') {
      filter.optedOut = true;
    } else if (optedOut === 'false') {
      filter.optedOut = false;
    }

    if (tags) {
      filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    let result;
    if (search) {
      result = await contactService.searchContacts(search, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } else {
      result = await contactService.getContacts(filter, {
        page: parseInt(page),
        limit: parseInt(limit),
      });
    }

    res.json({
      success: true,
      data: result.contacts,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get contact statistics
 * GET /admin/whatsapp/contacts/statistics
 */
async function getContactStatistics(req, res) {
  try {
    const stats = await contactService.getContactStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Create campaign
 * POST /admin/whatsapp/campaigns
 */
async function createCampaign(req, res) {
  try {
    const { name, message, templateName, templateParameters, audienceTags, sendMode, scheduledAt } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        success: false,
        error: 'Campaign name and message are required',
      });
    }

    const campaign = await campaignService.createCampaign({
      name,
      message,
      templateName,
      templateParameters,
      audienceTags,
      sendMode,
      scheduledAt,
      createdBy: req.user?.email || 'admin',
    });

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get all campaigns
 * GET /admin/whatsapp/campaigns
 */
async function getCampaigns(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const result = await campaignService.listCampaigns(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get campaign by ID
 * GET /admin/whatsapp/campaigns/:campaignId
 */
async function getCampaignById(req, res) {
  try {
    const { campaignId } = req.params;
    const campaign = await campaignService.getCampaignById(campaignId);

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Update campaign
 * PATCH /admin/whatsapp/campaigns/:campaignId
 */
async function updateCampaign(req, res) {
  try {
    const { campaignId } = req.params;
    const campaign = await campaignService.updateCampaign(campaignId, req.body);

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Queue campaign for sending
 * POST /admin/whatsapp/campaigns/:campaignId/queue
 */
async function queueCampaign(req, res) {
  try {
    const { campaignId } = req.params;
    const result = await campaignService.queueCampaign(campaignId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Launch campaign (start sending)
 * POST /admin/whatsapp/campaigns/:campaignId/launch
 */
async function launchCampaign(req, res) {
  try {
    const { campaignId } = req.params;
    const result = await campaignService.launchCampaign(campaignId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Pause campaign
 * POST /admin/whatsapp/campaigns/:campaignId/pause
 */
async function pauseCampaign(req, res) {
  try {
    const { campaignId } = req.params;
    const campaign = await campaignService.pauseCampaign(campaignId);

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Resume campaign
 * POST /admin/whatsapp/campaigns/:campaignId/resume
 */
async function resumeCampaign(req, res) {
  try {
    const { campaignId } = req.params;
    const campaign = await campaignService.resumeCampaign(campaignId);

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Delete campaign
 * DELETE /admin/whatsapp/campaigns/:campaignId
 */
async function deleteCampaign(req, res) {
  try {
    const { campaignId } = req.params;
    const campaign = await campaignService.deleteCampaign(campaignId);

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign deleted',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get campaign statistics
 * GET /admin/whatsapp/campaigns/:campaignId/statistics
 */
async function getCampaignStatistics(req, res) {
  try {
    const { campaignId } = req.params;
    const stats = await campaignService.getCampaignStatistics(campaignId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get dashboard statistics
 * GET /admin/whatsapp/statistics/dashboard
 */
async function getDashboardStatistics(req, res) {
  try {
    const stats = await campaignService.getDashboardStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Remove duplicate contacts
 * POST /admin/whatsapp/contacts/deduplicate
 */
async function deduplicateContacts(req, res) {
  try {
    const result = await contactService.removeDuplicates();

    res.json({
      success: true,
      data: result,
      message: 'Deduplication completed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Add tags to contacts
 * POST /admin/whatsapp/contacts/add-tags
 */
async function addTagsToContacts(req, res) {
  try {
    const { contactIds, tags } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid contactIds array required',
      });
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid tags array required',
      });
    }

    const result = await contactService.addTagsToContacts(contactIds, tags);

    res.json({
      success: true,
      data: result,
      message: 'Tags added successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  importContacts,
  getContacts,
  getContactStatistics,
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  queueCampaign,
  launchCampaign,
  pauseCampaign,
  resumeCampaign,
  deleteCampaign,
  getCampaignStatistics,
  getDashboardStatistics,
  deduplicateContacts,
  addTagsToContacts,
};
