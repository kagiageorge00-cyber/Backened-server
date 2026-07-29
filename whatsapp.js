const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const whatsappCloudService = (() => {
  try {
    return require('./services/whatsappCloudService');
  } catch (err) {
    console.warn('⚠️ WhatsApp Cloud service unavailable:', err.message);
    return null;
  }
})();

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const CLOUD_CONFIGURED = Boolean(
  WHATSAPP_PHONE_NUMBER_ID &&
  WHATSAPP_ACCESS_TOKEN &&
  whatsappCloudService &&
  whatsappCloudService.validateConfig()
);

async function sendWhatsAppMessage(to, message) {
  if (!to || !message) {
    console.warn('[WHATSAPP] Missing recipient or message');
    return { success: false, error: 'Missing recipient or message' };
  }

  const cleanedPhone = String(to)
    .replace(/[\s\-()\.\+]/g, '')
    .replace(/^00/, '');

  if (CLOUD_CONFIGURED) {
    try {
      const result = await whatsappCloudService.sendTextMessage(cleanedPhone, message);
      if (result && result.success) {
        return result;
      }
      throw new Error(result?.error || 'WhatsApp Cloud send failed');
    } catch (err) {
      console.error('[WHATSAPP] Cloud send failed:', err.message);
      // fall through to fallback behavior
    }
  }

  console.log('[WHATSAPP] Cloud API not configured or failed, falling back to test mode');
  console.log('[WHATSAPP] Fallback message:', { to: cleanedPhone, message });
  return { success: true, fallback: true, error: 'Fallback mode, message logged' };
}

module.exports = { sendWhatsAppMessage };
