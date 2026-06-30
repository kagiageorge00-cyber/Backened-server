const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const WhatsAppConnection = require('../models/WhatsAppConnection');
const { encrypt } = require('../utils/encryption');

const APP_ID = process.env.META_APP_ID || '1466441738033139';
const APP_SECRET = process.env.META_APP_SECRET || '';
const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION || 'v20.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const CONFIG_ID = process.env.META_CONFIG_ID || '2653481901734578';
const REDIRECT_URI = process.env.META_EMBEDDED_SIGNUP_REDIRECT_URI || `${process.env.BACKEND_URL || 'https://backened-server-1.onrender.com'}/api/whatsapp/callback`;

function logEvent(message, details) {
  console.log(`[whatsapp-embedded-signup] ${message}`, details || {});
}

function getMissingEnvVars() {
  const missing = [];
  if (!process.env.META_APP_ID) missing.push('META_APP_ID');
  if (!process.env.META_APP_SECRET) missing.push('META_APP_SECRET');
  if (!process.env.ENCRYPTION_KEY) missing.push('ENCRYPTION_KEY');
  if (!process.env.WHATSAPP_VERIFY_TOKEN) missing.push('WHATSAPP_VERIFY_TOKEN');
  if (!process.env.MONGO_URI) missing.push('MONGO_URI');
  return missing;
}

router.get('/config', (req, res) => {
  const missing = getMissingEnvVars();
  logEvent('config requested', { configId: CONFIG_ID, appId: APP_ID, redirectUri: REDIRECT_URI, missing });
  res.json({
    success: true,
    appId: APP_ID,
    configId: CONFIG_ID,
    redirectUri: REDIRECT_URI,
    missingEnvVars: missing,
  });
});

router.get('/connect', (req, res) => {
  const missing = getMissingEnvVars();
  logEvent('connect requested', { missing });

  if (missing.length) {
    return res.status(500).json({ success: false, error: 'Missing required environment variables', missing });
  }

  const authUrl = new URL('https://www.facebook.com/dialog/oauth');
  authUrl.searchParams.set('app_id', APP_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'business_management,whatsapp_business_management,public_profile');
  authUrl.searchParams.set('config_id', CONFIG_ID);
  authUrl.searchParams.set('extras', JSON.stringify({ setup: { business: { name: 'Bliss Travel and Tours 254' } } }));
  authUrl.searchParams.set('state', crypto.randomBytes(16).toString('hex'));

  logEvent('launching embedded signup', { authUrl: authUrl.toString() });
  res.redirect(authUrl.toString());
});

router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    logEvent('callback received', { code: code ? 'present' : 'missing', state, error, error_description });

    if (error) {
      logEvent('oauth error', { error, error_description });
      return res.status(400).json({ success: false, error, error_description });
    }

    if (!code) {
      logEvent('missing authorization code');
      return res.status(400).json({ success: false, error: 'Missing authorization code' });
    }

    const tokenResponse = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
      params: {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      },
    });

    const accessToken = tokenResponse.data.access_token;
    logEvent('access token exchanged', { tokenLength: accessToken?.length });

    const debugTokenResponse = await axios.get(`${GRAPH_BASE}/debug_token`, {
      params: {
        input_token: accessToken,
        access_token: `${APP_ID}|${APP_SECRET}`,
      },
    });

    const tokenInfo = debugTokenResponse.data.data || {};
    logEvent('token debug info', tokenInfo);

    const businessesResponse = await axios.get(`${GRAPH_BASE}/me/businesses`, {
      params: { access_token: accessToken },
    });

    const businesses = businessesResponse.data.data || [];
    logEvent('businesses discovered', { businesses });

    const primaryBusiness = businesses[0] || null;
    if (!primaryBusiness) {
      return res.status(404).json({ success: false, error: 'No connected businesses found' });
    }

    const wabaResponse = await axios.get(`${GRAPH_BASE}/${primaryBusiness.id}/owned_whatsapp_business_accounts`, {
      params: { access_token: accessToken },
    });

    const wabas = wabaResponse.data.data || [];
    logEvent('wabas discovered', { wabas });

    let selectedWaba = wabas[0] || null;
    if (!selectedWaba) {
      return res.status(404).json({ success: false, error: 'No WhatsApp Business Accounts available for this business' });
    }

    const phoneNumbersResponse = await axios.get(`${GRAPH_BASE}/${selectedWaba.id}/phone_numbers`, {
      params: { access_token: accessToken },
    });

    const phoneNumbers = phoneNumbersResponse.data.data || [];
    const primaryPhone = phoneNumbers[0] || null;
    logEvent('phone numbers discovered', { phoneNumbers });

    const encryptedToken = encrypt(accessToken, process.env.ENCRYPTION_KEY);
    const connection = await WhatsAppConnection.findOneAndUpdate(
      { wabaId: selectedWaba.id },
      {
        businessId: primaryBusiness.id,
        displayName: primaryBusiness.name || 'Bliss Travel and Tours 254',
        wabaId: selectedWaba.id,
        phoneNumberId: primaryPhone?.id || null,
        phoneNumber: primaryPhone?.display_phone_number || null,
        accessToken: encryptedToken,
        status: 'connected',
        webhookSubscribed: true,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    try {
      await axios.post(`${GRAPH_BASE}/${selectedWaba.id}/subscribed_apps`, null, {
        params: {
          subscribed_fields: 'messages,message_status',
          access_token: accessToken,
        },
      });
      logEvent('webhook subscription created', { wabaId: selectedWaba.id });
    } catch (subscriptionError) {
      logEvent('webhook subscription failed', { error: subscriptionError.message, details: subscriptionError.response?.data });
    }

    res.json({
      success: true,
      message: 'WhatsApp account connected successfully',
      connection: {
        businessId: connection.businessId,
        businessName: connection.displayName,
        wabaId: connection.wabaId,
        phoneNumberId: connection.phoneNumberId,
        phoneNumber: connection.phoneNumber,
        status: connection.status,
        webhookSubscribed: connection.webhookSubscribed,
      },
    });
  } catch (error) {
    logEvent('callback processing failed', { message: error.message, data: error.response?.data });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const connection = await WhatsAppConnection.findOne({ status: 'connected' }).sort({ createdAt: -1 }).lean();
    if (!connection) {
      return res.json({ connected: false, message: 'No connected WhatsApp account found.' });
    }

    res.json({
      connected: true,
      businessName: connection.displayName || null,
      businessId: connection.businessId || null,
      wabaId: connection.wabaId || null,
      phoneNumberId: connection.phoneNumberId || null,
      phoneNumber: connection.phoneNumber || null,
      status: connection.status || 'connected',
    });
  } catch (error) {
    console.error('[whatsapp-embedded-signup] status lookup failed', error.message);
    res.json({ connected: false, message: 'WhatsApp status unavailable right now.', error: error.message });
  }
});

module.exports = router;
