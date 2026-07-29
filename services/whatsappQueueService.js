/**
 * WhatsApp Message Queue Worker
 * Processes messages from queue and sends via WhatsApp Cloud API
 * Uses BullMQ for reliable job processing
 */

const { Worker, Queue } = require('bullmq');
const Redis = require('ioredis');
const WhatsAppQueue = require('../models/WhatsAppQueue');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppMessageLog = require('../models/WhatsAppMessageLog');
const whatsappCloudService = require('./whatsappCloudService');
require('dotenv').config();

let messageQueue = null;
let messageWorker = null;
let redisConnection = null;
let redisAvailable = null;
let redisErrorReported = false;
let redisResetInProgress = false;

function isRedisConnectionError(err) {
  if (!err) {
    return false;
  }

  if (typeof err === 'string') {
    return /ECONNREFUSED|ECONNRESET/i.test(err);
  }

  const message = String(err.message || err);
  if (/ECONNREFUSED|ECONNRESET/i.test(message)) {
    return true;
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
    return true;
  }

  if (err.cause) {
    return isRedisConnectionError(err.cause);
  }

  const nested = err.errors;
  if (nested) {
    const errors = Array.isArray(nested) ? nested : Array.from(nested);
    return errors.some(isRedisConnectionError);
  }

  if (err.stack && /ECONNREFUSED|ECONNRESET/i.test(err.stack)) {
    return true;
  }

  return false;
}

async function resetRedisState() {
  if (redisResetInProgress) {
    return;
  }

  redisResetInProgress = true;
  redisAvailable = false;
  redisErrorReported = false;

  const worker = messageWorker;
  const queue = messageQueue;
  const connection = redisConnection;

  messageWorker = null;
  messageQueue = null;
  redisConnection = null;

  if (worker) {
    worker.removeAllListeners();
    try {
      await worker.close();
    } catch (closeError) {
      // ignore worker close failure
    }
  }

  if (queue) {
    queue.removeAllListeners();
    try {
      await queue.close();
    } catch (closeError) {
      // ignore queue close failure
    }
  }

  if (connection) {
    connection.removeAllListeners();
    try {
      connection.disconnect();
    } catch (disconnectError) {
      // ignore disconnect failure
    }
  }

  redisResetInProgress = false;
}

function getRedisConnection() {
  if (redisConnection) {
    return redisConnection;
  }

  redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  redisConnection.on('error', err => {
    if (!redisErrorReported) {
      console.warn('⚠️ Redis connection error:', err.message);
      redisErrorReported = true;
    }
    redisAvailable = false;
  });

  redisConnection.on('end', () => {
    redisAvailable = false;
  });

  redisConnection.on('ready', () => {
    redisAvailable = true;
    redisErrorReported = false;
  });

  return redisConnection;
}

async function ensureRedisAvailable() {
  if (redisAvailable === true) {
    return true;
  }

  const connection = getRedisConnection();
  if (connection.status === 'ready') {
    redisAvailable = true;
    redisErrorReported = false;
    return true;
  }

  try {
    await connection.connect();
    await connection.ping();
    redisAvailable = true;
    redisErrorReported = false;
    return true;
  } catch (error) {
    if (!redisErrorReported) {
      console.warn('⚠️ Redis unavailable for WhatsApp queue:', error.message);
      redisErrorReported = true;
    }
    await resetRedisState();
    return false;
  }
}

async function createQueueIfNeeded() {
  if (messageQueue && redisAvailable !== false) {
    return messageQueue;
  }

  if (messageQueue && redisAvailable === false) {
    await resetRedisState();
  }

  const isAvailable = await ensureRedisAvailable();
  if (!isAvailable) {
    return null;
  }

  try {
    messageQueue = new Queue('whatsapp-messages', { connection: getRedisConnection() });
    messageQueue.on('error', err => {
      if (isRedisConnectionError(err)) {
        if (!redisErrorReported) {
          console.warn('⚠️ Redis connection failed for WhatsApp queue:', err.message);
          redisErrorReported = true;
        }
        resetRedisState().catch(() => {});
      } else {
        console.error('WhatsApp queue error:', err);
      }
    });

    try {
      await messageQueue.waitUntilReady();
    } catch (error) {
      if (isRedisConnectionError(error)) {
        if (!redisErrorReported) {
          console.warn('⚠️ Redis unavailable while initializing WhatsApp queue:', error.message);
          redisErrorReported = true;
        }
      } else {
        console.error('❌ WhatsApp queue failed to become ready:', error);
      }
      await resetRedisState();
      return null;
    }
  } catch (error) {
    console.warn('⚠️ Redis unavailable for WhatsApp queue; queue disabled:', error.message);
    await resetRedisState();
    return null;
  }

  return messageQueue;
}

async function createWorkerIfNeeded() {
  if (messageWorker && redisAvailable !== false) {
    return messageWorker;
  }

  if (messageWorker && redisAvailable === false) {
    await resetRedisState();
  }

  const queue = await createQueueIfNeeded();
  if (!queue) {
    return null;
  }

  try {
    messageWorker = new Worker(
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
      connection: getRedisConnection(),
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

    messageWorker.on('completed', job => {
      console.log(`✅ Job ${job.id} completed`);
    });

    messageWorker.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err.message);
    });

    messageWorker.on('error', err => {
      if (isRedisConnectionError(err)) {
        if (!redisErrorReported) {
          console.warn('⚠️ Redis connection failed for WhatsApp worker:', err.message);
          redisErrorReported = true;
        }
        resetRedisState().catch(() => {});
      } else {
        console.error('Worker error:', err);
      }
    });

    try {
      await messageWorker.waitUntilReady();
    } catch (error) {
      if (isRedisConnectionError(error)) {
        if (!redisErrorReported) {
          console.warn('⚠️ Redis unavailable while initializing WhatsApp worker:', error.message);
          redisErrorReported = true;
        }
      } else {
        console.error('❌ WhatsApp worker failed to become ready:', error);
      }
      await resetRedisState();
      return null;
    }
  } catch (error) {
    if (isRedisConnectionError(error)) {
      if (!redisErrorReported) {
        console.warn('⚠️ Redis connection failed while starting WhatsApp worker:', error.message);
        redisErrorReported = true;
      }
      await resetRedisState();
      return null;
    }

    console.warn('⚠️ Redis unavailable for WhatsApp worker; worker disabled:', error.message);
    await resetRedisState();
    return null;
  }

  return messageWorker;
}

/**
 * Process queue records and add jobs
 * This runs periodically to pick up pending messages
 */
async function processQueue() {
  try {
    const queue = await createQueueIfNeeded();
    if (!queue) {
      return { success: false, skipped: true, reason: 'redis_unavailable' };
    }
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
        await queue.add(
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
    const queue = await createQueueIfNeeded();
    if (!queue) {
      return { success: false, skipped: true, reason: 'redis_unavailable' };
    }

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
        await queue.add(
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

    const queue = await createQueueIfNeeded();
    if (!queue) {
      return { success: false, skipped: true, reason: 'redis_unavailable' };
    }

    for (const record of failedMessages) {
      record.status = 'pending';
      record.retryCount = 0;
      record.nextRetryAt = null;
      await record.save();

      await queue.add(
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

module.exports = {
  getMessageQueue: createQueueIfNeeded,
  getMessageWorker: createWorkerIfNeeded,
  processQueue,
  batchProcessCampaign,
  retryFailedMessages,
};
