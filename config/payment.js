require('dotenv').config();

const intasendConfig = {
  baseUrl: process.env.INTASEND_API_BASE_URL || 'https://pay.intasend.com/api',
  checkoutPath: process.env.INTASEND_CHECKOUT_PATH || '/v1/checkout',
  verifyPathTemplate: process.env.INTASEND_VERIFY_PATH_TEMPLATE || '/v1/transactions/:id',
  publicKey: process.env.INTASEND_PUBLIC_KEY || '',
  secretKey: process.env.INTASEND_SECRET_KEY || '',
  webhookSecret: process.env.INTASEND_WEBHOOK_SECRET || '',
};

const applicationFeeConfig = {
  amount: Number(process.env.APPLICATION_FEE_AMOUNT || 1300),
  currency: process.env.APPLICATION_FEE_CURRENCY || 'KES',
  title: process.env.APPLICATION_FEE_TITLE || 'Bliss Connect Application Fee',
};

module.exports = {
  intasendConfig,
  applicationFeeConfig,
};
