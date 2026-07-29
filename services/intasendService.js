const axios = require('axios');
const logger = require('../utils/logger');
const { intasendConfig } = require('../config/payment');

function buildHeaders() {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (intasendConfig.secretKey) {
    headers.Authorization = `Bearer ${intasendConfig.secretKey}`;
  }

  if (intasendConfig.publicKey) {
    headers['X-IntaSend-Public-Key'] = intasendConfig.publicKey;
  }

  return headers;
}

async function createCheckoutSession({
  candidate,
  amount,
  currency,
  paymentMethod,
  title,
  email,
  phoneNumber,
  metadata = {},
}) {
  if (!intasendConfig.secretKey) {
    throw new Error('INTASEND_SECRET_KEY is not configured.');
  }

  const payload = {
    amount: Number(amount),
    currency: currency || 'KES',
    email: email || candidate?.email || '',
    phone: phoneNumber || candidate?.phone || '',
    name: candidate?.fullName || candidate?.name || 'Bliss Connect Candidate',
    title: title || 'Bliss Connect Application Fee',
    payment_method: paymentMethod || 'mpesa',
    metadata: {
      source: 'bliss_connect',
      candidateId: candidate?.candidateId || candidate?._id || candidate?.id || '',
      ...metadata,
    },
  };

  const url = `${intasendConfig.baseUrl}${intasendConfig.checkoutPath}`;

  logger.info('Creating IntaSend checkout session', { url, paymentMethod, amount, currency });

  const response = await axios.post(url, payload, {
    headers: buildHeaders(),
    timeout: 30000,
  });

  const data = response?.data || {};
  const checkoutUrl = data?.checkout_url || data?.checkoutUrl || data?.url || data?.link || data?.data?.checkout_url || data?.data?.url || data?.data?.link;
  const invoiceId = data?.invoice_id || data?.invoiceId || data?.data?.invoice_id || data?.data?.invoiceId;
  const transactionId = data?.transaction_id || data?.transactionId || data?.data?.transaction_id || data?.data?.transactionId;
  const checkoutId = data?.checkout_id || data?.checkoutId || data?.data?.checkout_id || data?.data?.checkoutId;

  return {
    checkoutUrl,
    invoiceId,
    transactionId,
    checkoutId,
    raw: data,
  };
}

async function verifyTransaction(transactionId) {
  if (!transactionId) {
    return null;
  }

  if (!intasendConfig.secretKey) {
    return null;
  }

  const path = intasendConfig.verifyPathTemplate.replace(':id', encodeURIComponent(transactionId));
  const url = `${intasendConfig.baseUrl}${path}`;

  logger.info('Verifying IntaSend transaction', { transactionId, url });

  try {
    const response = await axios.get(url, {
      headers: buildHeaders(),
      timeout: 30000,
    });

    return response?.data || null;
  } catch (error) {
    logger.warn('IntaSend verification request failed', {
      transactionId,
      message: error?.response?.data?.message || error.message,
    });
    return null;
  }
}

module.exports = {
  createCheckoutSession,
  verifyTransaction,
};
