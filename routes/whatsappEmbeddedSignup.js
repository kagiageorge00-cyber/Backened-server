const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const WhatsAppConnection = require('../models/WhatsAppConnection');
const { encrypt } = require('../utils/encryption');

const APP_ID = process.env.META_APP_ID || '1992090441518045';
const APP_SECRET = process.env.META_APP_SECRET || '';
const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION || 'v20.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const CONFIG_ID = process.env.META_CONFIG_ID || '2653481901734578';
const REDIRECT_URI = process.env.META_EMBEDDED_SIGNUP_REDIRECT_URI || `${process.env.BACKEND_URL || 'https://backened-server-1.onrender.com'}/api/whatsapp/callback`;
const REQUESTED_SCOPES = ['whatsapp_business_management', 'whatsapp_business_messaging', 'whatsapp_business_manage_events', 'public_profile'];

function logEvent(message, details) {
  console.log(`[whatsapp-embedded-signup] ${message}`, details || {});
}

function getGraphApiEndpointPermissions(path) {
  if (path === '/me') return ['public_profile'];
  if (path === '/debug_token') return ['app-level'];
  if (path.includes('/owned_whatsapp_business_accounts')) return ['whatsapp_business_management'];
  if (path.includes('/phone_numbers')) return ['whatsapp_business_management'];
  if (path.includes('/subscribed_apps')) return ['whatsapp_business_management'];
  return ['unknown'];
}

function parseSignedRequest(signedRequest) {
  if (!signedRequest) return null;

  const encodedPayload = signedRequest.split('.')[1];
  if (!encodedPayload) return null;

  const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalizedPayload.length % 4 === 0 ? '' : '='.repeat(4 - (normalizedPayload.length % 4));

  try {
    const decodedPayload = Buffer.from(`${normalizedPayload}${padding}`, 'base64').toString('utf8');
    return JSON.parse(decodedPayload);
  } catch (error) {
    logEvent('failed to parse signed request payload', { signedRequest, error: error.message });
    return null;
  }
}

function extractEmbeddedSignupAssets(payload, query = {}, body = {}) {
  const data = payload?.data || payload?.payload?.data || payload?.response?.data || null;
  const bodyData = body?.data || body?.payload?.data || body?.response?.data || null;
  const sourceData = data || bodyData || null;
  const whatsappBusinessAccount = sourceData?.whatsapp_business_account || sourceData?.whatsappBusinessAccount || sourceData?.whatsapp_business_account_info || null;
  const business = sourceData?.business || sourceData?.business_info || sourceData?.business_details || null;
  const sessionInfo = payload?.session || payload?.session_info || sourceData?.session || sourceData?.session_info || null;
  const setupData = payload?.setup || sourceData?.setup || null;

  return {
    businessId: sourceData?.business_id || business?.id || query?.business_id || query?.businessId || body?.business_id || body?.businessId || null,
    businessName: sourceData?.business_name || business?.name || whatsappBusinessAccount?.display_name || whatsappBusinessAccount?.name || null,
    wabaId: whatsappBusinessAccount?.id || sourceData?.waba_id || sourceData?.wabaId || query?.waba_id || query?.wabaId || body?.waba_id || body?.wabaId || null,
    phoneNumberId: whatsappBusinessAccount?.phone_number_id || whatsappBusinessAccount?.phone_number?.id || sourceData?.phone_number_id || sourceData?.phoneNumberId || query?.phone_number_id || query?.phoneNumberId || body?.phone_number_id || body?.phoneNumberId || null,
    phoneNumber: whatsappBusinessAccount?.phone_number?.display_phone_number || whatsappBusinessAccount?.phone_number?.number || sourceData?.phone_number || query?.phone_number || query?.phoneNumber || body?.phone_number || body?.phoneNumber || null,
    sessionInfo,
    sessionInfoVersion: sourceData?.session_info_version || payload?.session_info_version || query?.session_info_version || body?.session_info_version || null,
    setupData,
    rawData: sourceData,
  };
}

async function callGraphApi({ method = 'get', path, params = {}, accessToken, label, data = null, grantedScopes = [], debugLog = null }) {
  const url = `${GRAPH_BASE}${path}`;
  const requiredScopes = getGraphApiEndpointPermissions(path);
  logEvent(`Graph API call: ${label}`, {
    method: method.toUpperCase(),
    url,
    requiredScopes,
    accessTokenPresent: Boolean(accessToken),
    grantedScopes,
    params,
  });

  try {
    const response = await axios({
      method,
      url,
      params,
      data,
    });

    logEvent(`Graph API response: ${label}`, {
      status: response.status,
      data: response.data,
    });

    if (debugLog) {
      debugLog.push({
        label,
        method: method.toUpperCase(),
        url,
        status: response.status,
        responseBody: response.data,
      });
    }

    return response;
  } catch (error) {
    const metaErrorBody = error.response?.data || null;
    logEvent(`Graph API error: ${label}`, {
      status: error.response?.status || null,
      message: error.message,
      data: metaErrorBody,
      code: metaErrorBody?.error?.code || null,
      errorMessage: metaErrorBody?.error?.message || null,
      requiredScopes,
    });

    if (debugLog) {
      debugLog.push({
        label,
        method: method.toUpperCase(),
        url,
        status: error.response?.status || null,
        responseBody: metaErrorBody,
        errorMessage: error.message,
      });
    }
    throw error;
  }
}

async function discoverWhatsAppAssets({ accessToken, businessId, wabaId, grantedScopes, debugLog }) {
  const discoveredAssets = {
    businessId: businessId || null,
    businessName: null,
    wabaId: wabaId || null,
    phoneNumberId: null,
    phoneNumber: null,
    discoveryAttempts: [],
    phoneNumbers: [],
  };

  const attemptEndpoint = async ({ label, path }) => {
    try {
      const response = await callGraphApi({
        method: 'get',
        path,
        params: { access_token: accessToken },
        label,
        accessToken,
        grantedScopes,
        debugLog,
      });

      const payload = response?.data?.data || response?.data || [];
      discoveredAssets.discoveryAttempts.push({ label, path, status: 'success', payload });

      if (Array.isArray(payload)) {
        discoveredAssets.phoneNumbers = payload;
        const firstItem = payload[0] || null;
        if (firstItem) {
          discoveredAssets.phoneNumberId = discoveredAssets.phoneNumberId || firstItem.id || firstItem.phone_number_id || null;
          discoveredAssets.phoneNumber = discoveredAssets.phoneNumber || firstItem.display_phone_number || firstItem.phone_number || null;
        }
      } else if (payload && typeof payload === 'object') {
        discoveredAssets.businessId = discoveredAssets.businessId || payload.business_id || payload.id || null;
        discoveredAssets.businessName = discoveredAssets.businessName || payload.name || null;
        discoveredAssets.wabaId = discoveredAssets.wabaId || payload.id || payload.waba_id || null;
        discoveredAssets.phoneNumberId = discoveredAssets.phoneNumberId || payload.phone_number_id || null;
        discoveredAssets.phoneNumber = discoveredAssets.phoneNumber || payload.display_phone_number || payload.phone_number || null;
      }

      return response;
    } catch (error) {
      discoveredAssets.discoveryAttempts.push({ label, path, status: 'error', error: error.response?.data || error.message });
      return null;
    }
  };

  if (businessId) {
    await attemptEndpoint({ label: '/business/owned_whatsapp_business_accounts', path: `/${businessId}/owned_whatsapp_business_accounts` });
  }

  if (wabaId) {
    await attemptEndpoint({ label: '/waba/phone_numbers', path: `/${wabaId}/phone_numbers` });
  }

  return discoveredAssets;
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
  authUrl.searchParams.set('scope', REQUESTED_SCOPES.join(','));
  authUrl.searchParams.set('config_id', CONFIG_ID);
  authUrl.searchParams.set('extras', JSON.stringify({ setup: { business: { name: 'Bliss Travel and Tours 254' } } }));
  authUrl.searchParams.set('state', crypto.randomBytes(16).toString('hex'));

  logEvent('launching embedded signup', { authUrl: authUrl.toString(), requestedScopes: REQUESTED_SCOPES });
  res.redirect(authUrl.toString());
});

router.all('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    const graphCallLog = [];
    const signedRequestPayload = parseSignedRequest(req.query.signed_request || req.body?.signed_request);
    const sessionInfo = signedRequestPayload?.data?.session || signedRequestPayload?.session || signedRequestPayload?.data?.session_info || null;

    const callbackQueryFields = req.query && typeof req.query === 'object' ? Object.keys(req.query) : [];
    const callbackBodyFields = req.body && typeof req.body === 'object' ? Object.keys(req.body) : [];
    const sessionLoggingEnabled = Boolean(sessionInfo || signedRequestPayload?.data?.session_info_version || signedRequestPayload?.session_info_version || signedRequestPayload?.data?.setup || signedRequestPayload?.setup || req.query?.setup || req.body?.setup);

    logEvent('callback payload', {
      query: req.query,
      queryFields: callbackQueryFields,
      body: req.body || null,
      bodyFields: callbackBodyFields,
      headers: {
        host: req.headers.host,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent'],
      },
      signedRequestPresent: Boolean(req.query.signed_request || req.body?.signed_request),
      signedRequestPayload,
      sessionInfo,
      sessionInfoVersion: signedRequestPayload?.data?.session_info_version || signedRequestPayload?.session_info_version || null,
      setupData: signedRequestPayload?.data?.setup || signedRequestPayload?.setup || null,
      sessionLoggingEnabled,
      code: code ? 'present' : 'missing',
      state,
      error,
      error_description,
    });

    if (error) {
      logEvent('oauth error', { error, error_description });
      return res.status(400).json({ success: false, error, error_description });
    }

    if (!code) {
      logEvent('missing authorization code', { query: req.query });
      return res.status(400).json({ success: false, error: 'Missing authorization code' });
    }

    logEvent('authorization code received', { code });
    logEvent('token exchange request', {
      appId: APP_ID,
      configId: CONFIG_ID,
      redirectUri: REDIRECT_URI,
      requestedScopes: REQUESTED_SCOPES,
      code,
    });

    const tokenResponse = await callGraphApi({
      method: 'get',
      path: '/oauth/access_token',
      params: {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      },
      label: 'token exchange',
      accessToken: null,
      debugLog: graphCallLog,
    });

    const grantedScopes = tokenResponse.data.scope ? tokenResponse.data.scope.split(',').map((scope) => scope.trim()).filter(Boolean) : [];
    logEvent('token exchange response', {
      status: tokenResponse.status,
      response: tokenResponse.data,
      grantedScopes,
      rawResponse: tokenResponse.data,
    });
    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      logEvent('token exchange missing access token', tokenResponse.data);
      return res.status(400).json({ success: false, error: 'Meta did not return an access token', meta: tokenResponse.data });
    }

    logEvent('access token exchanged', { tokenLength: accessToken?.length });

    const debugTokenResponse = await callGraphApi({
      method: 'get',
      path: '/debug_token',
      params: {
        input_token: accessToken,
        access_token: `${APP_ID}|${APP_SECRET}`,
      },
      label: 'debug_token',
      accessToken: `${APP_ID}|${APP_SECRET}`,
      debugLog: graphCallLog,
    });

    const tokenInfo = debugTokenResponse.data.data || {};
    const grantedScopesFromDebugToken = Array.isArray(tokenInfo.scopes) ? tokenInfo.scopes : (tokenInfo.scopes ? String(tokenInfo.scopes).split(',').map((scope) => scope.trim()).filter(Boolean) : []);
    logEvent('token debug info', { ...tokenInfo, grantedScopes: grantedScopesFromDebugToken });

    const meResponse = await callGraphApi({
      method: 'get',
      path: '/me',
      params: { access_token: accessToken },
      label: '/me',
      accessToken,
      grantedScopes: grantedScopesFromDebugToken,
      debugLog: graphCallLog,
    });

    const embeddedSignupAssets = extractEmbeddedSignupAssets(signedRequestPayload, req.query, req.body);
    logEvent('embedded signup assets extracted', {
      ...embeddedSignupAssets,
      meResponseData: meResponse?.data || null,
      sessionInfo,
    });

    let selectedWabaId = embeddedSignupAssets.wabaId || req.query.waba_id || req.query.wabaId || null;
    let selectedBusinessId = embeddedSignupAssets.businessId || req.query.business_id || req.query.businessId || null;
    let selectedDisplayName = embeddedSignupAssets.businessName || req.query.business_name || req.query.businessName || 'Bliss Travel and Tours 254';
    let selectedPhoneId = embeddedSignupAssets.phoneNumberId || req.query.phone_number_id || req.query.phoneNumberId || null;
    let selectedPhoneNumber = embeddedSignupAssets.phoneNumber || req.query.phone_number || req.query.phoneNumber || null;

    const discoveredAssets = await discoverWhatsAppAssets({
      accessToken,
      businessId: selectedBusinessId,
      wabaId: selectedWabaId,
      grantedScopes: grantedScopesFromDebugToken,
      debugLog: graphCallLog,
    });

    selectedBusinessId = discoveredAssets.businessId || selectedBusinessId;
    selectedDisplayName = selectedDisplayName || discoveredAssets.businessName || 'Bliss Travel and Tours 254';
    selectedWabaId = discoveredAssets.wabaId || selectedWabaId;
    selectedPhoneId = discoveredAssets.phoneNumberId || selectedPhoneId;
    selectedPhoneNumber = discoveredAssets.phoneNumber || selectedPhoneNumber;

    const targetPhoneMatch = [selectedPhoneNumber, selectedPhoneId, discoveredAssets.phoneNumber, ...(discoveredAssets.phoneNumbers || []).map((item) => item.display_phone_number || item.phone_number || null)].find((value) => value === '0102084855') || null;

    logEvent('WhatsApp Business Accounts discovered', {
      discoveredAssets,
      businessId: selectedBusinessId,
      wabaId: selectedWabaId,
      phoneNumberId: selectedPhoneId,
      phoneNumber: selectedPhoneNumber,
      targetPhoneMatch,
      targetPhoneNumber: '0102084855',
    });

    if (!selectedWabaId) {
      logEvent('no WABA ID available after Embedded Signup', {
        embeddedSignupAssets,
        query: req.query,
        sessionInfo,
        graphCalls: graphCallLog,
      });
      return res.status(404).json({ success: false, error: 'No WhatsApp Business Account ID was returned by Embedded Signup', embeddedSignupAssets, graphCalls: graphCallLog });
    }

    logEvent('resolved WhatsApp asset IDs', {
      businessId: selectedBusinessId,
      businessName: selectedDisplayName,
      wabaId: selectedWabaId,
      phoneNumberId: selectedPhoneId,
      phoneNumber: selectedPhoneNumber,
    });

    if (!selectedPhoneId) {
      const phoneNumbersResponse = await callGraphApi({
        method: 'get',
        path: `/${selectedWabaId}/phone_numbers`,
        params: { access_token: accessToken },
        label: '/phone_numbers',
        accessToken,
        grantedScopes: grantedScopesFromDebugToken,
        debugLog: graphCallLog,
      });

      const phoneNumbers = phoneNumbersResponse.data.data || [];
      const primaryPhone = phoneNumbers[0] || null;
      selectedPhoneId = primaryPhone?.id || null;
      selectedPhoneNumber = primaryPhone?.display_phone_number || primaryPhone?.phone_number || null;
      logEvent('phone numbers discovered', { phoneNumbers });
    }

    const encryptedToken = encrypt(accessToken, process.env.ENCRYPTION_KEY);
    const connection = await WhatsAppConnection.findOneAndUpdate(
      { wabaId: selectedWabaId },
      {
        businessId: selectedBusinessId || selectedWabaId || 'embedded-signup',
        displayName: selectedDisplayName,
        wabaId: selectedWabaId,
        phoneNumberId: selectedPhoneId || null,
        phoneNumber: selectedPhoneNumber || null,
        accessToken: encryptedToken,
        status: 'connected',
        webhookSubscribed: true,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    try {
      await callGraphApi({
        method: 'post',
        path: `/${selectedWabaId}/subscribed_apps`,
        params: {
          subscribed_fields: 'messages,message_status',
          access_token: accessToken,
        },
        label: '/subscribed_apps',
        accessToken,
        grantedScopes: grantedScopesFromDebugToken,
        data: null,
        debugLog: graphCallLog,
      });
      logEvent('webhook subscription created', { wabaId: selectedWabaId });
    } catch (subscriptionError) {
      logEvent('webhook subscription failed', {
        message: subscriptionError.message,
        responseData: subscriptionError.response?.data,
        status: subscriptionError.response?.status,
      });
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
      callback: {
        businessId: selectedBusinessId,
        businessName: selectedDisplayName,
        wabaId: selectedWabaId,
        phoneNumberId: selectedPhoneId,
        phoneNumber: selectedPhoneNumber,
      },
      discoveredAssets,
      graphCalls: graphCallLog,
      sessionInfo,
      targetPhoneMatch,
    });
  } catch (error) {
    const metaErrorBody = error.response?.data || null;
    const metaErrorCode = metaErrorBody?.error?.code || error.code || null;
    const metaErrorMessage = metaErrorBody?.error?.message || error.message || null;
    logEvent('callback processing failed', {
      message: error.message,
      status: error.response?.status,
      data: metaErrorBody,
      errorCode: metaErrorCode,
      errorMessage: metaErrorMessage,
    });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      meta: metaErrorBody,
      metaErrorCode,
      metaErrorMessage,
      callbackPayload: {
        query: req.query,
        body: req.body || null,
      },
      graphCalls: error.graphCallLog || [],
    });
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

router.__testHelpers = {
  parseSignedRequest,
  extractEmbeddedSignupAssets,
};

module.exports = router;
