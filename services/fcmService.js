const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
let cachedAccessToken = '';
let accessTokenExpiresAt = 0;

function getServiceAccount() {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw && process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    try {
      raw = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8');
    } catch (_) {
      throw new Error('Could not read FIREBASE_SERVICE_ACCOUNT_FILE');
    }
  }
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (_) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON');
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
  if (!serviceAccount.client_email || !serviceAccount.private_key || !projectId) {
    throw new Error('Firebase service account is missing client_email, private_key, or project_id');
  }

  return {
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    projectId,
    tokenUri: serviceAccount.token_uri || GOOGLE_TOKEN_URL,
  };
}

async function getAccessToken(serviceAccount) {
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: serviceAccount.clientEmail,
      scope: FCM_SCOPE,
      aud: serviceAccount.tokenUri,
      iat: now,
      exp: now + 3600,
    },
    serviceAccount.privateKey,
    { algorithm: 'RS256' },
  );
  const response = await axios.post(
    serviceAccount.tokenUri,
    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  cachedAccessToken = response.data.access_token;
  accessTokenExpiresAt = Date.now() + Number(response.data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

async function sendToToken(token, { title, message, data = {}, link = '' }) {
  const serviceAccount = getServiceAccount();
  const accessToken = await getAccessToken(serviceAccount);
  const stringData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value ?? '')]),
  );
  if (link) stringData.link = link;

  const response = await axios.post(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(serviceAccount.projectId)}/messages:send`,
    {
      message: {
        token,
        notification: { title, body: message },
        data: { title, body: message, ...stringData },
        webpush: {
          notification: {
            title,
            body: message,
            icon: '/icons/Icon-192.png',
          },
          ...(link ? { fcmOptions: { link } } : {}),
        },
      },
    },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return response.data;
}

async function sendToTokens(tokens, notification) {
  const uniqueTokens = [...new Set(tokens.map((item) =>
    typeof item === 'string' ? item : item?.token,
  ).filter(Boolean))];
  const results = await Promise.allSettled(
    uniqueTokens.map((token) => sendToToken(token, notification)),
  );
  const sent = results.filter((result) => result.status === 'fulfilled').length;
  return {
    sent,
    failed: results.length - sent,
    total: results.length,
    errors: results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason?.response?.data?.error?.message || result.reason?.message || 'FCM send failed'),
  };
}

module.exports = { sendToToken, sendToTokens };
