const axios = require('axios');
const WhatsappConnection = require('../models/WhatsappConnection');
const { encrypt, decrypt } = require('../utils/encryption');

const APP_ID = process.env.META_APP_ID || '2653481901734578';
const APP_SECRET = process.env.META_APP_SECRET || '';
const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION || 'v17.0';

const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function exchangeToken(userAccessToken) {
  // Validate token
  const appAccessToken = `${APP_ID}|${APP_SECRET}`;
  const debug = await axios.get(`${GRAPH_BASE}/debug_token`, {
    params: { input_token: userAccessToken, access_token: appAccessToken }
  });

  if (!debug.data || !debug.data.data || !debug.data.data.is_valid) {
    const err = new Error('Invalid Facebook access token');
    err.status = 401;
    throw err;
  }

  // Fetch businesses the user can manage
  const businessesRes = await axios.get(`${GRAPH_BASE}/me/businesses`, {
    params: { access_token: userAccessToken }
  });

  const businesses = (businessesRes.data && businessesRes.data.data) || [];

  // For each business fetch owned_whatsapp_business_accounts
  const enriched = [];
  for (const b of businesses) {
    try {
      const wabaRes = await axios.get(`${GRAPH_BASE}/${b.id}/owned_whatsapp_business_accounts`, {
        params: { access_token: userAccessToken }
      });
      const wabas = (wabaRes.data && wabaRes.data.data) || [];
      const wabaDetailed = [];
      for (const w of wabas) {
        // fetch phone numbers
        try {
          const pnRes = await axios.get(`${GRAPH_BASE}/${w.id}/phone_numbers`, {
            params: { access_token: userAccessToken }
          });
          const phones = (pnRes.data && pnRes.data.data) || [];
          wabaDetailed.push({ ...w, phone_numbers: phones });
        } catch (e) {
          wabaDetailed.push({ ...w, phone_numbers: [] });
        }
      }
      enriched.push({ ...b, wabas: wabaDetailed });
    } catch (e) {
      enriched.push({ ...b, wabas: [] });
    }
  }

  return { businesses: enriched };
}

async function saveConnection(payload) {
  const { businessId, wabaId, phoneNumberId, accessToken, displayName, phoneNumber } = payload;

  // Validate token
  const appAccessToken = `${APP_ID}|${APP_SECRET}`;
  const debug = await axios.get(`${GRAPH_BASE}/debug_token`, {
    params: { input_token: accessToken, access_token: appAccessToken }
  });
  if (!debug.data || !debug.data.data || !debug.data.data.is_valid) {
    const err = new Error('Invalid Facebook access token');
    err.status = 401;
    throw err;
  }

  // Persist connection (encrypt token)
  const encrypted = encrypt(accessToken, process.env.ENCRYPTION_KEY);
  const doc = await WhatsappConnection.findOneAndUpdate(
    { wabaId },
    {
      businessId,
      wabaId,
      phoneNumberId,
      displayName,
      phoneNumber,
      accessToken: encrypted,
      status: 'connected'
    },
    { upsert: true, new: true }
  );

  // Subscribe to webhooks for incoming messages & status updates
  try {
    const subRes = await axios.post(`${GRAPH_BASE}/${wabaId}/subscribed_apps`, null, {
      params: {
        subscribed_fields: 'messages,message_status',
        access_token: accessToken
      }
    });
    doc.webhookSubscribed = true;
    await doc.save();
  } catch (e) {
    // log and continue; webhook subscription may require additional permissions
    console.warn('Webhook subscribe failed', e?.response?.data || e.message);
  }

  return {
    ok: true,
    connection: {
      id: doc._id,
      businessId: doc.businessId,
      wabaId: doc.wabaId,
      phoneNumberId: doc.phoneNumberId,
      displayName: doc.displayName,
      phoneNumber: doc.phoneNumber,
      status: doc.status,
      webhookSubscribed: doc.webhookSubscribed
    }
  };
}

// Webhook verification
function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Use environment verify token
  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
}

async function handleWebhookEvent(req, res) {
  // Basic processing for incoming message and status events
  try {
    const body = req.body;
    console.log('Webhook event', JSON.stringify(body));

    // Here you would parse and forward to your business logic or message queue

    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook handling error', e);
    res.sendStatus(500);
  }
}

module.exports = { exchangeToken, saveConnection, verifyWebhook, handleWebhookEvent };
