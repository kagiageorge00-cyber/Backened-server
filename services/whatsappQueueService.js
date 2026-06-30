/**
 * WhatsApp Message Queue Worker
 * Processes messages from queue and sends via WhatsApp Cloud API
 * Uses BullMQ for reliable job processing
 */

const { Worker, Queue } = require('bullmq');
const redis = require('ioredis');
const WhatsAppQueue = require('../models/WhatsAppQueue');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppMessageLog = require('../models/WhatsAppMessageLog');
const whatsappCloudService = require('./whatsappCloudService');
require('dotenv').config();

const redisConnection = new redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Create queue
const messageQueue = new Queue('whatsapp-messages', { connection: redisConnection });

/**
 * Process a single message from queue
 */
const messageWorker = new Worker(
  'whatsapp-messages',
  async job => {
    const { queueId, phoneNumber, message, messageType, templateName, templateParams, campaignId } = job.data;

    try {
      console.log(`📤 Processing message to ${phoneNumber} (Job: ${job.id})`);

      // Get the queue record
      const queueRecord = await WhatsAppQueue.findById(queueId);
      if (!queueRecord) {
        throw new Error('Queue record not found');
      }

      const campaign = await WhatsAppCampaign.findById(campaignId);
      if (!campaign || campaign.status !== 'running') {
        queueRecord.status = 'pending';
        queueRecord.lastError = 'Campaign not running';
        await queueRecord.save();
        return { status: 'skipped', reason: 'campaign_not_running' };
      }

      // Check if contact is opted out
      const optedOutRecord = await require('../models/WhatsAppOptOut').findOne({ phoneNumber });
      if (optedOutRecord) {
        queueRecord.status = 'skipped';
        queueRecord.lastError = 'Contact is opted out';
        await queueRecord.save();

        // Log to message log
        await WhatsAppMessageLog.create({
          campaignId,
          contactId: queueRecord.contactId,
          phoneNumber,
          direction: 'outbound',
          messageType,
          content: message,
          status: 'skipped',
          error: 'Contact is opted out',
        });

        return { status: 'skipped', reason: 'opted_out' };
      }

      // Send message via WhatsApp Cloud API
      let sendResult;

      if (messageType === 'template' && templateName) {
        sendResult = await whatsappCloudService.sendTemplateMessage(
          phoneNumber,
          templateName,
          templateParams || []
        );
      } else if (messageType === 'text') {
        sendResult = await whatsappCloudService.sendTextMessage(phoneNumber, message);
      } else {
        throw new Error('Invalid message type');
      }

      if (!sendResult.success) {
        throw new Error(sendResult.error || 'Failed to send message');
      }

      // Update queue record
      queueRecord.status = 'sent';
      queueRecord.providerMessageId = sendResult.messageId;
      queueRecord.sentAt = new Date();
      queueRecord.retryCount = 0;
      await queueRecord.save();

      // Log to message log
      await WhatsAppMessageLog.create({
        campaignId,
        contactId: queueRecord.contactId,
        phoneNumber,
        direction: 'outbound',
        messageType,
        content: message,
        providerMessageId: sendResult.messageId,
        status: 'sent',
      });

      console.log(`✅ Message sent to ${phoneNumber} (ID: ${sendResult.messageId})`);

      return {
        status: 'sent',
        messageId: sendResult.messageId,
      };
    } catch (error) {
      console.error(`❌ Error processing message to ${phoneNumber}:`, error.message);

      const queueRecord = await WhatsAppQueue.findById(queueId);
      if (queueRecord) {
        queueRecord.retryCount = (queueRecord.retryCount || 0) + 1;
        queueRecord.lastError = error.message;

        if (queueRecord.retryCount >= queueRecord.maxRetries) {
          queueRecord.status = 'failed';
          queueRecord.failedAt = new Date();
          console.log(`⛔ Message to ${phoneNumber} failed after ${queueRecord.maxRetries} retries`);
        } else {
          // Schedule retry (exponential backoff: 5s, 30s, 5m)
          const backoffMs = [5000, 30000, 300000][queueRecord.retryCount - 1] || 300000;
          queueRecord.nextRetryAt = new Date(Date.now() + backoffMs);
          queueRecord.status = 'pending';
          console.log(`🔄 Retrying message to ${phoneNumber} in ${backoffMs / 1000}s`);
        }

        await queueRecord.save();

        // Log failure
        await WhatsAppMessageLog.create({
          campaignId: queueRecord.campaignId,
          contactId: queueRecord.contactId,
          phoneNumber,
          direction: 'outbound',
          messageType: queueRecord.messageType,
          content: queueRecord.message,
          status: queueRecord.status,
          error: error.message,
        });
      }

      // Retry job
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10, // Process 10 messages concurrently
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
    },
  }
);

/**
 * Process queue records and add jobs
 * This runs periodically to pick up pending messages
 */
async function processQueue() {
  try {
    // Find pending messages that are ready to retry
    const runningCampaignIds = await WhatsAppCampaign.find({ status: 'running' }).distinct('_id');

    const pendingMessages = await WhatsAppQueue.find({
      campaignId: { $in: runningCampaignIds },
      status: 'pending',
      $or: [
        { nextRetryAt: { $lte: new Date() } },
        { nextRetryAt: null },
      ],
    })
      .limit(100)
      .lean();

    console.log(`📨 Processing ${pendingMessages.length} pending messages for running campaigns`);

    for (const queueRecord of pendingMessages) {
      try {
        // Add job to queue
        await messageQueue.add(
          'send-message',
          {
            queueId: queueRecord._id.toString(),
            phoneNumber: queueRecord.phoneNumber,
            message: queueRecord.message,
            messageType: queueRecord.messageType,
            templateName: queueRecord.templateName,
            templateParams: queueRecord.templateParams,
            campaignId: queueRecord.campaignId.toString(),
          },
          {
            jobId: `msg-${queueRecord._id}`,
            priority: queueRecord.priority || 0,
            delay: 0,
          }
        );

        // Update status to processing
        await WhatsAppQueue.findByIdAndUpdate(queueRecord._id, {
          status: 'processing',
        });
      } catch (error) {
        console.error(`Error adding job for ${queueRecord.phoneNumber}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error in processQueue:', error);
  }
}

/**
 * Batch process campaign messages
 * @param {string} campaignId - Campaign ID
 * @param {number} batchSize - Messages per batch
 * @returns {Promise<Object>} Batch result
 */
async function batchProcessCampaign(campaignId, batchSize = 100) {
  try {
    const queueRecords = await WhatsAppQueue.find({
      campaignId: require('mongoose').Types.ObjectId(campaignId),
      status: 'pending',
    })
      .limit(batchSize)
      .lean();

    console.log(`📦 Batch processing ${queueRecords.length} messages for campaign ${campaignId}`);

    let added = 0;
    for (const record of queueRecords) {
      try {
        await messageQueue.add(
          'send-message',
          {
            queueId: record._id.toString(),
            phoneNumber: record.phoneNumber,
            message: record.message,
            messageType: record.messageType,
            templateName: record.templateName,
            templateParams: record.templateParams,
            campaignId,
          },
          {
            jobId: `msg-${record._id}`,
          }
        );
        added++;
      } catch (error) {
        console.error(`Failed to add job for ${record.phoneNumber}:`, error.message);
      }
    }

    return {
      campaignId,
      added,
      total: queueRecords.length,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Retry failed messages
 * @returns {Promise<Object>} Retry result
 */
async function retryFailedMessages() {
  try {
    const failedMessages = await WhatsAppQueue.find({
      status: 'failed',
      retryCount: { $lt: 3 },
    }).limit(50);

    console.log(`🔄 Retrying ${failedMessages.length} failed messages`);

    for (const record of failedMessages) {
      record.status = 'pending';
      record.retryCount = 0;
      record.nextRetryAt = null;
      await record.save();

      await messageQueue.add(
        'send-message',
        {
          queueId: record._id.toString(),
          phoneNumber: record.phoneNumber,
          message: record.message,
          messageType: record.messageType,
          templateName: record.templateName,
          templateParams: record.templateParams,
          campaignId: record.campaignId.toString(),
        },
        { jobId: `msg-${record._id}` }
      );
    }

    return { retried: failedMessages.length };
  } catch (error) {
    throw error;
  }
}

// Event handlers
messageWorker.on('completed', job => {
  console.log(`✅ Job ${job.id} completed`);
});

messageWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

messageWorker.on('error', err => {
  console.error('Worker error:', err);
});

module.exports = {
  messageQueue,
  messageWorker,
  processQueue,
  batchProcessCampaign,
  retryFailedMessages,
};
