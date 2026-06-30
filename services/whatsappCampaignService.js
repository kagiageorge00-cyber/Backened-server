/**
 * WhatsApp Campaign Service
 * Handles campaign creation, scheduling, and management
 */

const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppQueue = require('../models/WhatsAppQueue');
const WhatsAppContact = require('../models/WhatsAppContact');
const { Queue } = require('bullmq');
const redis = require('ioredis');

const redisClient = new redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

/**
 * Create a new campaign
 * @param {Object} campaignData - Campaign details
 * @returns {Promise<Object>} Created campaign
 */
async function createCampaign(campaignData) {
  try {
    const {
      name,
      message,
      templateName,
      templateParameters,
      audienceTags,
      sendMode,
      scheduledAt,
      createdBy,
    } = campaignData;

    // Validate required fields
    if (!name || !message) {
      throw new Error('Campaign name and message are required');
    }

    const campaign = new WhatsAppCampaign({
      name: name.trim(),
      message,
      templateName: templateName || '',
      templateParameters: templateParameters || [],
      audienceTags: audienceTags || [],
      sendMode: sendMode || 'immediate',
      scheduledAt: sendMode === 'scheduled' ? scheduledAt : null,
      status: 'draft',
      createdBy: createdBy || 'admin',
    });

    await campaign.save();
    return campaign;
  } catch (error) {
    throw error;
  }
}

/**
 * Get campaign by ID with statistics
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Campaign with stats
 */
async function getCampaignById(campaignId) {
  try {
    const campaign = await WhatsAppCampaign.findById(campaignId).lean();
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get queue statistics
    const queueStats = await WhatsAppQueue.aggregate([
      { $match: { campaignId: require('mongoose').Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {};
    queueStats.forEach(stat => {
      stats[stat._id] = stat.count;
    });

    return {
      ...campaign,
      queueStats: stats,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * List campaigns with pagination
 * @param {Object} filter - MongoDB filter
 * @param {Object} options - { page, limit, sort }
 * @returns {Promise<Object>} Paginated campaigns
 */
async function listCampaigns(filter = {}, options = {}) {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;

  const campaigns = await WhatsAppCampaign.find(filter)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await WhatsAppCampaign.countDocuments(filter);

  return {
    campaigns,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update campaign
 * @param {string} campaignId - Campaign ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated campaign
 */
async function updateCampaign(campaignId, updateData) {
  try {
    const campaign = await WhatsAppCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Only allow updating draft campaigns
    if (campaign.status !== 'draft') {
      throw new Error('Only draft campaigns can be edited');
    }

    Object.assign(campaign, updateData);
    await campaign.save();
    return campaign;
  } catch (error) {
    throw error;
  }
}

/**
 * Queue campaign for sending
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Queue results
 */
async function queueCampaign(campaignId) {
  try {
    const campaign = await WhatsAppCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft') {
      throw new Error('Campaign must be in draft status to queue');
    }

    // Get audience based on tags
    let query = { optedOut: false };
    if (campaign.audienceTags.length > 0) {
      query.tags = { $in: campaign.audienceTags };
    }

    const contacts = await WhatsAppContact.find(query).select('_id phoneNumber').lean();

    if (contacts.length === 0) {
      throw new Error('No matching contacts found for this campaign');
    }

    // Create queue entries
    const queueEntries = contacts.map(contact => ({
      campaignId,
      contactId: contact._id,
      phoneNumber: contact.phoneNumber,
      message: campaign.message,
      messageType: campaign.templateName ? 'template' : 'text',
      templateName: campaign.templateName,
      templateParams: campaign.templateParameters,
      status: 'pending',
    }));

    await WhatsAppQueue.insertMany(queueEntries);

    // Update campaign status
    campaign.status = 'queued';
    campaign.stats.queued = contacts.length;
    await campaign.save();

    return {
      campaignId,
      contactsQueued: contacts.length,
      status: 'queued',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Launch campaign (send immediately or at scheduled time)
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Launch result
 */
async function launchCampaign(campaignId) {
  try {
    const campaign = await WhatsAppCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'queued') {
      throw new Error('Campaign must be queued before launching');
    }

    // Update status
    campaign.status = 'running';
    campaign.updatedAt = new Date();
    await campaign.save();

    // Notify queue worker
    await redisClient.set(`campaign:${campaignId}:launch`, '1', 'EX', 86400);

    return {
      campaignId,
      status: 'running',
      message: 'Campaign launched successfully',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Pause a running campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Updated campaign
 */
async function pauseCampaign(campaignId) {
  const campaign = await WhatsAppCampaign.findByIdAndUpdate(
    campaignId,
    { status: 'paused', updatedAt: new Date() },
    { new: true }
  );

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  return campaign;
}

/**
 * Resume a paused campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Updated campaign
 */
async function resumeCampaign(campaignId) {
  const campaign = await WhatsAppCampaign.findByIdAndUpdate(
    campaignId,
    { status: 'running', updatedAt: new Date() },
    { new: true }
  );

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  return campaign;
}

/**
 * Complete a campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Updated campaign
 */
async function completeCampaign(campaignId) {
  const campaign = await WhatsAppCampaign.findByIdAndUpdate(
    campaignId,
    { status: 'completed', updatedAt: new Date() },
    { new: true }
  );

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  return campaign;
}

/**
 * Delete campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Deleted campaign
 */
async function deleteCampaign(campaignId) {
  try {
    const campaign = await WhatsAppCampaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft') {
      throw new Error('Only draft campaigns can be deleted');
    }

    // Delete all queue entries
    await WhatsAppQueue.deleteMany({ campaignId });

    // Delete campaign
    await WhatsAppCampaign.findByIdAndDelete(campaignId);

    return campaign;
  } catch (error) {
    throw error;
  }
}

/**
 * Get campaign statistics
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Statistics
 */
async function getCampaignStatistics(campaignId) {
  try {
    const campaign = await WhatsAppCampaign.findById(campaignId).lean();
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get detailed queue statistics
    const stats = await WhatsAppQueue.aggregate([
      { $match: { campaignId: require('mongoose').Types.ObjectId(campaignId) } },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          deliveryRate: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                delivered: {
                  $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
                },
                read: {
                  $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    const byStatus = {};
    stats[0].byStatus.forEach(item => {
      byStatus[item._id] = item.count;
    });

    const deliveryStats = stats[0].deliveryRate[0] || {};

    return {
      campaignId,
      campaignName: campaign.name,
      status: campaign.status,
      queued: byStatus.pending || 0,
      sent: byStatus.sent || 0,
      delivered: byStatus.delivered || 0,
      read: byStatus.read || 0,
      failed: byStatus.failed || 0,
      skipped: byStatus.skipped || 0,
      deliveryRate: deliveryStats.total
        ? ((deliveryStats.delivered / deliveryStats.total) * 100).toFixed(2)
        : 0,
      readRate: deliveryStats.total
        ? ((deliveryStats.read / deliveryStats.total) * 100).toFixed(2)
        : 0,
      totalContacts: deliveryStats.total || 0,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all campaigns statistics (dashboard)
 * @returns {Promise<Object>} Dashboard statistics
 */
async function getDashboardStatistics() {
  try {
    const totalCampaigns = await WhatsAppCampaign.countDocuments();
    const activeCampaigns = await WhatsAppCampaign.countDocuments({
      status: { $in: ['running', 'queued'] },
    });
    const completedCampaigns = await WhatsAppCampaign.countDocuments({ status: 'completed' });

    const queueStats = await WhatsAppQueue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const queueByStatus = {};
    queueStats.forEach(stat => {
      queueByStatus[stat._id] = stat.count;
    });

    return {
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        completed: completedCampaigns,
      },
      queue: queueByStatus,
      deliveryMetrics: {
        totalQueued: queueByStatus.pending || 0,
        totalSent: queueByStatus.sent || 0,
        totalDelivered: queueByStatus.delivered || 0,
        totalRead: queueByStatus.read || 0,
        totalFailed: queueByStatus.failed || 0,
      },
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createCampaign,
  getCampaignById,
  listCampaigns,
  updateCampaign,
  queueCampaign,
  launchCampaign,
  pauseCampaign,
  resumeCampaign,
  completeCampaign,
  deleteCampaign,
  getCampaignStatistics,
  getDashboardStatistics,
};
