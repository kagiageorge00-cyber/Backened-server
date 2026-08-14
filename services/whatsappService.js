const { sendWhatsAppMessage } = require('../whatsapp');
const whatsappCloudService = (() => {
  try {
    return require('./whatsappCloudService');
  } catch (err) {
    return null;
  }
})();

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber || '')
    .replace(/[\s\-()\.]/g, '')
    .replace(/^00/, '')
    .replace(/^\+/, '');
}

function buildTemplateText(templateName, parameters = {}) {
  const values = parameters && typeof parameters === 'object' ? parameters : {};
  switch (templateName) {
    case 'medical_booking_received':
      return `Hello ${values.name || 'there'}, your medical booking request for ${values.location || 'Bliss Connect'} has been received. Reference: ${values.referenceCode || 'N/A'}.`;
    case 'medical_booking_approved':
      return `Hello ${values.name || 'there'}, your medical booking has been approved. ${values.nextSteps || 'Please check your booking details.'}`;
    case 'medical_booking_rejected':
      return `Hello ${values.name || 'there'}, your medical booking was not approved. ${values.reason || 'Please contact support.'}`;
    default:
      return 'Bliss Connect notification received.';
  }
}

async function sendWhatsAppNotification({ phoneNumber, templateName, parameters = {}, message }) {
  if (!phoneNumber) {
    throw new Error('phoneNumber is required');
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (templateName && whatsappCloudService && whatsappCloudService.validateConfig()) {
    const parameterList = Object.values(parameters || {});
    const result = await whatsappCloudService.sendTemplateMessage(
      normalizedPhone,
      templateName,
      parameterList,
      'en'
    );

    if (result && result.success) {
      return result;
    }

    if (result && result.error) {
      console.warn('[WHATSAPP SERVICE] Template send failed, falling back to text:', result.error);
    }
  }

  const fallbackMessage = message || buildTemplateText(templateName, parameters);
  return sendWhatsAppMessage(normalizedPhone, fallbackMessage);
}

module.exports = { sendWhatsAppNotification };
