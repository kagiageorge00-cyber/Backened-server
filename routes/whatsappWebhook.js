/**
 * WhatsApp Webhook Handler
 * Receives and processes incoming WhatsApp messages, status updates, and opt-outs
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const WhatsAppMessageLog = require('../models/WhatsAppMessageLog');
const WhatsAppQueue = require('../models/WhatsAppQueue');
const contactService = require('../services/whatsappContactService');
const mongoose = require('mongoose');
const { ingestIncomingBlissAppMessage } = require('../services/staffOperationsBridge');

const WEBHOOK_APP_SECRET = process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || process.env.WHATSAPP_WEBHOOK_APP_SECRET || '';

function getVerifyToken() {
  return process.env.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
}

function getMissingEnvVars() {
  const missing = [];
  if (!process.env.META_APP_SECRET) missing.push('META_APP_SECRET');
  if (!process.env.ENCRYPTION_KEY) missing.push('ENCRYPTION_KEY');
  if (!process.env.WHATSAPP_VERIFY_TOKEN) missing.push('WHATSAPP_VERIFY_TOKEN');
  if (!process.env.MONGO_URI) missing.push('MONGO_URI');
  return missing;
}

function logWebhookEvent(message, details) {
  console.log(`[whatsapp-webhook] ${message}`, details);
}

function verifyWebhookSignature(req) {
  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!WEBHOOK_APP_SECRET) {
    console.warn('⚠️ WhatsApp webhook secret is not configured; signature validation is disabled');
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const payload = req.rawBody ? req.rawBody : Buffer.from(JSON.stringify(req.body));
  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_APP_SECRET).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch (err) {
    return false;
  }
}

// Opt-out keywords detection
const OPT_OUT_KEYWORDS = ['STOP', 'UNSUBSCRIBE', 'REMOVE', 'OPT OUT', 'NO JOBS'];

/**
 * GET /webhook
 * WhatsApp sends verification request on webhook setup
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = getVerifyToken();
  const missingEnvVars = getMissingEnvVars();

  logWebhookEvent('incoming verification request', {
    query: req.query,
    mode,
    tokenReceived: token ? `${token.slice(0, 8)}${token.length > 8 ? '...' : ''}` : null,
    challengeReceived: challenge || null,
    verifyTokenConfigured: Boolean(verifyToken),
    missingEnvVars,
  });

  if (missingEnvVars.length) {
    console.error('[whatsapp-webhook] missing environment variables', { missingEnvVars });
  }

  if (!verifyToken) {
    console.error('[whatsapp-webhook] verification failed: WHATSAPP_VERIFY_TOKEN is not configured');
    return res.sendStatus(403);
  }

  const isValid = mode === 'subscribe' && token === verifyToken;
  if (isValid) {
    console.log('[whatsapp-webhook] verification succeeded');
    return res.status(200).send(String(challenge || ''));
  }

  console.error('[whatsapp-webhook] verification failed', {
    expectedTokenConfigured: Boolean(verifyToken),
    receivedToken: token || null,
    mode,
  });
  return res.sendStatus(403);
});

/**
 * Check if message contains opt-out keywords
 */
function isOptOutMessage(messageText) {
  if (!messageText) return false;
  const upperText = messageText.toUpperCase().trim();
  return OPT_OUT_KEYWORDS.some(keyword => upperText.includes(keyword));
}

/**
 * Extract opt-out reason from message
 */
function extractOptOutReason(messageText) {
  if (!messageText) return 'OTHER';
  const upperText = messageText.toUpperCase().trim();
  for (const keyword of OPT_OUT_KEYWORDS) {
    if (upperText.includes(keyword)) {
      return keyword;
    }
  }
  return 'OTHER';
}

/**
 * Handle incoming message
 */
function incomingMessageText(message) {
  const text = message.text?.body ||
    message.interactive?.button_reply?.title ||
    message.interactive?.list_reply?.title ||
    message.button?.text ||
    message.image?.caption ||
    message.video?.caption ||
    message.document?.caption ||
    message.audio?.caption ||
    '';
  if (text.trim()) return text.trim();
  if (message.type === 'location' && message.location) {
    const { latitude, longitude, name, address } = message.location;
    return [name, address, latitude != null && longitude != null ? `${latitude}, ${longitude}` : '']
      .filter(Boolean)
      .join(' — ') || 'Location received';
  }
  return `[${String(message.type || 'unknown').replace(/^\w/, (letter) => letter.toUpperCase())} received]`;
}

async function handleIncomingMessage(message, phoneNumber, timestamp, contactName = '') {
    const messageText = incomingMessageText(message);
    const normalizedPhone = String(phoneNumber || '').replace(/\D/g, '');
    if (!normalizedPhone) throw new Error('WhatsApp sender phone number is missing.');

    const logMessage = async (status, eventType) => WhatsAppMessageLog.create({
      phoneNumber,
      direction: 'inbound',
      messageType: message.type || 'text',
      content: messageText,
      providerMessageId: message.id || '',
      status,
      eventType,
      createdAt: timestamp ? new Date(Number(timestamp) * 1000) : new Date(),
    });

    console.log(`📨 Incoming message from ${phoneNumber}: ${messageText}`);

    // Check for opt-out keywords
    if (isOptOutMessage(messageText)) {
      const reason = extractOptOutReason(messageText);
      console.log(`⛔ Opt-out detected from ${phoneNumber}: ${reason}`);

      await contactService.markContactAsOptedOut(phoneNumber, reason, messageText);
      await logMessage('opted_out', 'opt_out_detection');
    } else {
      await logMessage('received', 'message_received');
    }

    await ingestIncomingBlissAppMessage({
      sourceMessageId: message.id || '',
      conversationId: `whatsapp-${normalizedPhone}`,
      customerName: contactName || `WhatsApp ${phoneNumber}`,
      customerPhone: phoneNumber,
      userType: 'WhatsApp customer',
      message_text: messageText,
      message_type: message.type || 'text',
      channel: 'whatsapp',
    });
}

/**
 * Handle message status updates
 */
async function handleStatusUpdate(status, messageId, phoneNumber, timestamp) {
  try {
    const statusType = status.status;
    console.log(`📊 Status update: ${statusType} for message ${messageId} to ${phoneNumber}`);

    // Update queue record
    const queueUpdate = await WhatsAppQueue.findOneAndUpdate(
      { providerMessageId: messageId },
      {
        status: ['sent', 'delivered', 'read', 'failed'].includes(statusType) ? statusType : 'sent',
        ...(statusType === 'failed' ? { failedAt: new Date(), lastError: status.errors?.[0]?.title || status.errors?.[0]?.message || '' } : {}),
        ...(statusType === 'delivered' ? { deliveredAt: new Date() } : {}),
        ...(statusType === 'sent' ? { sentAt: new Date() } : {}),
        updatedAt: new Date(),
      },
      { new: true }
    );

    // Log the status update
    await WhatsAppMessageLog.findOneAndUpdate(
      { providerMessageId: messageId },
      {
        status: ['sent', 'delivered', 'read', 'failed'].includes(statusType) ? statusType : 'sent',
        phoneNumber: phoneNumber || 'unknown',
        direction: 'outbound',
        messageType: 'text',
        error: status.errors?.[0]?.title || status.errors?.[0]?.message || '',
        updatedAt: new Date(),
        eventType: `message_${statusType}`,
      },
      { upsert: true }
    );

    if (queueUpdate) {
      console.log(`✅ Queue updated for message ${messageId}`);

      // Update timestamp if applicable
      if (statusType === 'delivered') {
        queueUpdate.deliveredAt = new Date();
        await queueUpdate.save();
      } else if (statusType === 'read') {
        queueUpdate.readAt = new Date();
        await queueUpdate.save();
      }
    }
  } catch (error) {
    console.error('Error handling status update:', error);
  }
}

/**
 * POST /webhook
 * Receive webhook events from WhatsApp
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    logWebhookEvent('incoming event payload', {
      body,
      headers: {
        'x-hub-signature-256': req.headers['x-hub-signature-256'] ? 'present' : 'missing',
      },
      missingEnvVars: getMissingEnvVars(),
    });

    if (!verifyWebhookSignature(req)) {
      console.warn('[whatsapp-webhook] signature validation failed or skipped; acknowledging event');
    }

    // Check if this is a valid webhook object
    if (!body.object || body.object !== 'whatsapp_business_account') {
      console.log('Invalid webhook object');
      return res.sendStatus(200);
    }

    // Process all entries
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const changeValue = change.value;
            const phoneNumber = changeValue.metadata?.phone_number_id;

            // Handle incoming messages
            if (changeValue.messages && Array.isArray(changeValue.messages)) {
              for (const message of changeValue.messages) {
                const contact = (changeValue.contacts || []).find((item) =>
                  String(item.wa_id || '') === String(message.from || ''),
                );
                await handleIncomingMessage(
                  message,
                  message.from,
                  message.timestamp,
                  contact?.profile?.name || '',
                );
              }
            }

            // Handle message status updates
            if (changeValue.statuses && Array.isArray(changeValue.statuses)) {
              for (const status of changeValue.statuses) {
                if (status.status === 'failed') {
                  console.error('[whatsapp-webhook] Meta reports message delivery failed', {
                    messageId: status.id,
                    recipientId: status.recipient_id,
                    errors: (status.errors || []).map((error) => ({
                      code: error.code,
                      title: error.title,
                      message: error.message,
                      details: error.error_data?.details,
                    })),
                  });
                }
                await handleStatusUpdate(
                  status,
                  status.id,
                  status.recipient_id,
                  status.timestamp
                );
              }
            }
          }
        }
      }
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    if (!res.headersSent) return res.sendStatus(500);
  }
});

module.exports = router;
