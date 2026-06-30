/**
 * WhatsApp Cloud API Service
 * Handles all WhatsApp messaging through official Meta Cloud API
 */

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

// WhatsApp Cloud API Configuration
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WABA_ID = process.env.WHATSAPP_WABA_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = 'v20.0';
const API_BASE_URL = process.env.WHATSAPP_API_BASE_URL || `https://graph.facebook.com/${API_VERSION}`;
const DEBUG_API_BASE_URL = 'https://graph.facebook.com/v23.0';

// Validate configuration
function validateConfig() {
  const missing = [];
  if (!PHONE_NUMBER_ID) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!WABA_ID) missing.push('WHATSAPP_WABA_ID');
  if (!ACCESS_TOKEN) missing.push('WHATSAPP_ACCESS_TOKEN');
  
  if (missing.length > 0) {
    console.warn(`⚠️ WhatsApp Cloud API: Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

async function fetchGraphApi(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    const data = await response.json().catch(() => null);
    console.log('📡 WhatsApp Graph API debug response', {
      url,
      status: response.status,
      ok: response.ok,
      body: data,
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    };
  } catch (error) {
    console.error('❌ WhatsApp Graph API debug request failed:', error.message);
    return {
      ok: false,
      status: null,
      statusText: error.message,
      data: null,
      error: error.message,
    };
  }
}

async function validateWhatsAppCredentials() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken) {
    return {
      tokenValid: false,
      error: {
        error: {
          message: 'WHATSAPP_ACCESS_TOKEN is not configured',
        },
      },
    };
  }

  if (!phoneNumberId) {
    return {
      tokenValid: false,
      error: {
        error: {
          message: 'WHATSAPP_PHONE_NUMBER_ID is not configured',
        },
      },
    };
  }

  const url = `${DEBUG_API_BASE_URL}/me`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json().catch(() => null);
    console.log('📡 WhatsApp Graph API validation response', {
      url,
      status: response.status,
      ok: response.ok,
      body: data,
    });

    if (!response.ok) {
      return {
        tokenValid: false,
        error: data || {
          message: response.statusText || 'Graph API validation failed',
        },
      };
    }

    return {
      tokenValid: true,
      user: data,
    };
  } catch (error) {
    console.error('❌ WhatsApp Graph API validation request failed:', error.message);
    return {
      tokenValid: false,
      error: {
        message: error.message,
      },
    };
  }
}

async function getWhatsAppAssetsReport() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const wabaId = process.env.WHATSAPP_WABA_ID;

  const requests = [];

  const makeRequest = async (label, url) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json().catch(() => null);
      console.log('📡 WhatsApp assets report response', {
        label,
        url,
        status: response.status,
        ok: response.ok,
        body: data,
      });

      requests.push({
        label,
        url,
        status: response.status,
        ok: response.ok,
        body: data,
      });

      return { label, url, status: response.status, ok: response.ok, body: data };
    } catch (error) {
      console.error('❌ WhatsApp assets report request failed:', { label, url, error: error.message });
      requests.push({
        label,
        url,
        ok: false,
        error: error.message,
      });

      return { label, url, ok: false, error: error.message };
    }
  };

  const results = {};

  if (accessToken) {
    results.me = await makeRequest('me', `${DEBUG_API_BASE_URL}/me?fields=id,name`);
    results.debugToken = await makeRequest('debug_token', `${DEBUG_API_BASE_URL}/debug_token`);
  }

  if (wabaId) {
    results.waba = await makeRequest('waba', `${DEBUG_API_BASE_URL}/${wabaId}?fields=id,name`);
  }

  if (phoneNumberId) {
    results.phoneNumber = await makeRequest('phoneNumber', `${DEBUG_API_BASE_URL}/${phoneNumberId}?fields=id,display_phone_number,verified_name`);
  }

  return {
    accessTokenConfigured: Boolean(accessToken),
    phoneNumberIdConfigured: Boolean(phoneNumberId),
    wabaIdConfigured: Boolean(wabaId),
    results,
    requests,
  };
}

async function verifyWhatsAppAccess() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const wabaId = process.env.WHATSAPP_WABA_ID;

  const results = {};
  const requests = [];

  const makeRequest = async (label, url) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const rawBody = await response.text();
      let parsedBody = null;
      try {
        parsedBody = rawBody ? JSON.parse(rawBody) : null;
      } catch (error) {
        parsedBody = rawBody;
      }

      const entry = {
        label,
        url,
        statusCode: response.status,
        ok: response.ok,
        statusText: response.statusText,
        body: parsedBody,
        errorBody: response.ok ? null : parsedBody,
        rawBody,
      };
      requests.push(entry);
      return entry;
    } catch (error) {
      const entry = {
        label,
        url,
        ok: false,
        statusCode: null,
        statusText: error.message,
        body: null,
        errorBody: null,
        rawBody: null,
        error: error.message,
      };
      requests.push(entry);
      return entry;
    }
  };

  if (accessToken) {
    results.me = await makeRequest('me', `${DEBUG_API_BASE_URL}/me?fields=id,name`);
  }

  if (wabaId) {
    results.waba = await makeRequest('waba', `${DEBUG_API_BASE_URL}/${wabaId}?fields=id,name`);
  }

  if (phoneNumberId) {
    results.phoneNumber = await makeRequest('phoneNumber', `${DEBUG_API_BASE_URL}/${phoneNumberId}?fields=id,display_phone_number,verified_name`);
  }

  if (wabaId) {
    results.phoneNumbers = await makeRequest('phoneNumbers', `${DEBUG_API_BASE_URL}/${wabaId}/phone_numbers`);
  }

  return {
    env: {
      wabaId: wabaId || null,
      phoneNumberId: phoneNumberId || null,
      tokenConfigured: Boolean(accessToken),
    },
    results,
    requests,
  };
}

async function getWhatsAppDebugReport() {
  const errors = [];
  const tokenInfo = {
    tokenValid: false,
    tokenOwner: null,
    phoneNumberAccessible: false,
    phoneData: null,
    wabaAccessible: false,
    wabaData: null,
    errors,
  };

  if (!ACCESS_TOKEN) {
    errors.push('WHATSAPP_ACCESS_TOKEN is not configured');
  }
  if (!PHONE_NUMBER_ID) {
    errors.push('WHATSAPP_PHONE_NUMBER_ID is not configured');
  }
  if (!WABA_ID) {
    errors.push('WHATSAPP_WABA_ID is not configured');
  }

  if (!ACCESS_TOKEN) {
    return tokenInfo;
  }

  const meUrl = `${DEBUG_API_BASE_URL}/me`;
  const meResult = await fetchGraphApi(meUrl);
  tokenInfo.tokenValid = meResult.ok;
  tokenInfo.tokenOwner = meResult.data || { error: meResult.data?.error || 'Unable to resolve token owner' };
  if (!meResult.ok) {
    errors.push(`GET ${meUrl} failed: ${meResult.statusText || 'Unknown error'}`);
  }

  if (PHONE_NUMBER_ID) {
    const phoneUrl = `${DEBUG_API_BASE_URL}/${PHONE_NUMBER_ID}`;
    const phoneResult = await fetchGraphApi(phoneUrl);
    tokenInfo.phoneNumberAccessible = phoneResult.ok;
    tokenInfo.phoneData = phoneResult.data || { error: phoneResult.data?.error || 'Unable to resolve phone number data' };
    if (!phoneResult.ok) {
      errors.push(`GET ${phoneUrl} failed: ${phoneResult.statusText || 'Unknown error'}`);
    }
  }

  if (WABA_ID) {
    const wabaUrl = `${DEBUG_API_BASE_URL}/${WABA_ID}`;
    const wabaResult = await fetchGraphApi(wabaUrl);
    tokenInfo.wabaAccessible = wabaResult.ok;
    tokenInfo.wabaData = wabaResult.data || { error: wabaResult.data?.error || 'Unable to resolve WABA data' };
    if (!wabaResult.ok) {
      errors.push(`GET ${wabaUrl} failed: ${wabaResult.statusText || 'Unknown error'}`);
    }
  }

  return tokenInfo;
}

/**
 * Send text message via WhatsApp Cloud API
 * @param {string} phoneNumber - Recipient phone number (format: 1234567890)
 * @param {string} message - Message body
 * @returns {Promise<Object>} Response from WhatsApp API
 */
async function sendTextMessage(phoneNumber, message) {
  try {
    if (!validateConfig()) {
      throw new Error('WhatsApp Cloud API not configured');
    }

    const url = `${API_BASE_URL}/${PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error?.message || `WhatsApp API Error: ${response.status}`);
    }

    console.log('✅ WhatsApp message sent:', {
      messageId: data?.messages?.[0]?.id,
      to: phoneNumber,
    });

    return {
      success: true,
      messageId: data?.messages?.[0]?.id,
      data,
    };
  } catch (error) {
    console.error('❌ WhatsApp send error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function sendTestMessage(to, message = 'Bliss Connect test message. WhatsApp Cloud API connection successful.') {
  try {
    if (!validateConfig()) {
      throw new Error('WhatsApp Cloud API not configured');
    }

    const url = `${API_BASE_URL}/${PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: message,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    console.log('📡 WhatsApp test send response', {
      url,
      status: response.status,
      ok: response.ok,
      body: data,
    });

    if (!response.ok) {
      return {
        success: false,
        httpStatus: response.status,
        metaError: data,
        graphApiErrorCode: data?.error?.code,
        graphApiErrorSubcode: data?.error?.error_subcode,
        rawMetaResponse: data,
      };
    }

    return {
      success: true,
      httpStatus: response.status,
      metaResponse: data,
      rawMetaResponse: data,
    };
  } catch (error) {
    console.error('❌ WhatsApp test send error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send template message via WhatsApp Cloud API
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} templateName - Template name registered with WhatsApp
 * @param {Array} parameters - Template parameters
 * @param {string} languageCode - Language code (default: 'en')
 * @returns {Promise<Object>}
 */
async function sendTemplateMessage(phoneNumber, templateName, parameters = [], languageCode = 'en') {
  try {
    if (!validateConfig()) {
      throw new Error('WhatsApp Cloud API not configured');
    }

    const url = `${API_BASE_URL}/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    if (parameters.length > 0) {
      payload.template.components = [
        {
          type: 'body',
          parameters: parameters.map(param => ({ type: 'text', text: String(param) })),
        },
      ];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `WhatsApp API Error: ${response.status}`);
    }

    console.log('✅ WhatsApp template sent:', {
      messageId: data.messages?.[0]?.id,
      to: phoneNumber,
      template: templateName,
    });

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      data,
    };
  } catch (error) {
    console.error('❌ WhatsApp template error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send message with media (image, video, document, audio)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} mediaType - Type: 'image', 'video', 'document', 'audio'
 * @param {string} mediaUrl - URL or object_ID of media
 * @param {string} caption - Optional caption for image/video
 * @returns {Promise<Object>}
 */
async function sendMediaMessage(phoneNumber, mediaType, mediaUrl, caption = '') {
  try {
    if (!validateConfig()) {
      throw new Error('WhatsApp Cloud API not configured');
    }

    if (!['image', 'video', 'document', 'audio'].includes(mediaType)) {
      throw new Error('Invalid media type. Must be: image, video, document, or audio');
    }

    const url = `${API_BASE_URL}/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: mediaType,
      [mediaType]: {
        link: mediaUrl,
      },
    };

    if ((mediaType === 'image' || mediaType === 'video') && caption) {
      payload[mediaType].caption = caption;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `WhatsApp API Error: ${response.status}`);
    }

    console.log('✅ WhatsApp media sent:', {
      messageId: data.messages?.[0]?.id,
      to: phoneNumber,
      type: mediaType,
    });

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      data,
    };
  } catch (error) {
    console.error('❌ WhatsApp media error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send interactive message (buttons)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} bodyText - Message body
 * @param {Array} buttons - Array of buttons [{id, title}, ...]
 * @param {string} footerText - Optional footer text
 * @returns {Promise<Object>}
 */
async function sendInteractiveMessage(phoneNumber, bodyText, buttons = [], footerText = '') {
  try {
    if (!validateConfig()) {
      throw new Error('WhatsApp Cloud API not configured');
    }

    if (buttons.length === 0 || buttons.length > 3) {
      throw new Error('Interactive messages require 1-3 buttons');
    }

    const url = `${API_BASE_URL}/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title.substring(0, 20), // Max 20 chars
            },
          })),
        },
      },
    };

    if (footerText) {
      payload.interactive.footer = { text: footerText.substring(0, 60) }; // Max 60 chars
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `WhatsApp API Error: ${response.status}`);
    }

    console.log('✅ WhatsApp interactive message sent:', {
      messageId: data.messages?.[0]?.id,
      to: phoneNumber,
    });

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      data,
    };
  } catch (error) {
    console.error('❌ WhatsApp interactive error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send bulk messages to multiple recipients
 * @param {Array} recipients - Array of phone numbers
 * @param {string} message - Message body
 * @param {Object} options - Additional options {delay, templateName, parameters}
 * @returns {Promise<Object>}
 */
async function sendBulkMessages(recipients, message, options = {}) {
  try {
    if (!validateConfig()) {
      throw new Error('WhatsApp Cloud API not configured');
    }

    const delay = options.delay || 1000; // 1 second delay between messages
    const results = {
      successful: [],
      failed: [],
      total: recipients.length,
    };

    for (let i = 0; i < recipients.length; i++) {
      const phoneNumber = recipients[i];
      
      try {
        let result;
        if (options.templateName) {
          result = await sendTemplateMessage(phoneNumber, options.templateName, options.parameters);
        } else {
          result = await sendTextMessage(phoneNumber, message);
        }

        if (result.success) {
          results.successful.push({
            phoneNumber,
            messageId: result.messageId,
          });
        } else {
          results.failed.push({
            phoneNumber,
            error: result.error,
          });
        }

        // Delay between messages
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        results.failed.push({
          phoneNumber,
          error: error.message,
        });
      }
    }

    console.log('✅ Bulk messages completed:', {
      successful: results.successful.length,
      failed: results.failed.length,
    });

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('❌ Bulk messages error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Mark message as read
 * @param {string} messageId - WhatsApp message ID
 * @returns {Promise<Object>}
 */
async function markAsRead(messageId) {
  try {
    if (!validateConfig()) {
      throw new Error('WhatsApp Cloud API not configured');
    }

    const url = `${API_BASE_URL}/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `WhatsApp API Error: ${response.status}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Mark as read error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get message status
 * @param {string} messageId - WhatsApp message ID
 * @returns {Promise<Object>}
 */
async function getMessageStatus(messageId) {
  try {
    if (!validateConfig()) {
      throw new Error('WhatsApp Cloud API not configured');
    }

    const url = `${API_BASE_URL}/${messageId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `WhatsApp API Error: ${response.status}`);
    }

    return {
      success: true,
      status: data.status,
      data,
    };
  } catch (error) {
    console.error('❌ Get status error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify webhook token
 * @param {string} token - Verification token from webhook
 * @returns {boolean}
 */
function verifyWebhookToken(token) {
  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'bliss_whatsapp_verify_token';
  return token === expectedToken;
}

/**
 * Process incoming webhook message
 * @param {Object} entry - Webhook entry from WhatsApp
 * @returns {Promise<Object>}
 */
async function processWebhookMessage(entry) {
  try {
    const message = entry.messaging[0];
    
    if (!message) {
      return { success: false, error: 'No message data' };
    }

    const incomingMessage = {
      messageId: message.message?.id,
      from: message.from,
      timestamp: message.timestamp,
      type: message.message?.type,
      text: message.message?.text?.body || '',
      status: message.message?.status,
    };

    console.log('📨 Incoming message:', incomingMessage);

    return {
      success: true,
      message: incomingMessage,
    };
  } catch (error) {
    console.error('❌ Webhook process error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  sendTextMessage,
  sendTestMessage,
  sendTemplateMessage,
  sendMediaMessage,
  sendInteractiveMessage,
  sendBulkMessages,
  markAsRead,
  getMessageStatus,
  verifyWebhookToken,
  processWebhookMessage,
  validateConfig,
  getConfig: () => ({
    phoneNumberId: PHONE_NUMBER_ID,
    wabaId: WABA_ID,
    apiVersion: API_VERSION,
    isConfigured: validateConfig(),
  }),
  getWhatsAppDebugReport,
  getWhatsAppAssetsReport,
  validateWhatsAppCredentials,
  verifyWhatsAppAccess,
};
