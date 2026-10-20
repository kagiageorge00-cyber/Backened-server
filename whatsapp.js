require('dotenv').config();

const whatsappCloudService = (() => {
  try {
    return require('./services/whatsappCloudService');
  } catch (err) {
    console.warn('⚠️ WhatsApp Cloud service unavailable:', err.message);
    return null;
  }
})();

async function sendWhatsAppMessage(to, message) {
  if (!to || !message) {
    console.warn('[WHATSAPP] Missing recipient or message');
    return { success: false, error: 'Missing recipient or message' };
  }

  const cleanedPhone = String(to)
    .replace(/[\s\-()\.\+]/g, '')
    .replace(/^00/, '');

  if (!whatsappCloudService || !whatsappCloudService.validateConfig()) {
    const error = 'WhatsApp Cloud API is not configured. Check WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.';
    console.error(`[WHATSAPP] ${error}`);
    return { success: false, error };
  }

  try {
    const result = await whatsappCloudService.sendTextMessage(cleanedPhone, message);
    if (result?.success === true) return result;
    const error = result?.error || 'WhatsApp Cloud API rejected the message.';
    console.error('[WHATSAPP] Cloud send failed:', error);
    return { success: false, error, ...(result?.data ? { data: result.data } : {}) };
  } catch (err) {
    console.error('[WHATSAPP] Cloud send failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendWhatsAppMessage };
