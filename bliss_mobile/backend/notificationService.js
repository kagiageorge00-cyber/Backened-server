// Unified notification system
async function sendNotification(user, message) {
  try {
    await sendWhatsAppMessage(user.phone, message);
  } catch (e) {
    console.log('[NOTIFY FALLBACK]', user.phone, message);
  }
}

// Reminder notification (if medical not booked after 24h)
async function sendMedicalReminder(user) {
  const message = 'Reminder: Please book your medical test to continue your application on Bliss Connect.';
  await sendNotification(user, message);
}

module.exports.sendNotification = sendNotification;
module.exports.sendMedicalReminder = sendMedicalReminder;
const { sendWhatsAppMessage } = require('./whatsapp');

async function notifyPaymentSuccess(user) {
  const message = 'Hello 👋, your payment has been received successfully. Your application is now being processed.';
  try {
    await sendWhatsAppMessage(user.phone, message);
  } catch (e) {
    console.log('WhatsApp failed, continue');
  }
}


// Accepts: { phone, name, message }
async function notifyRegistrationSuccess(user) {
  const message = user.message || 'Welcome to Bliss Connect 🎉. Your account has been created successfully.';
  try {
    await sendWhatsAppMessage(user.phone, message);
  } catch (e) {
    console.log('WhatsApp failed, fallback to log:', message);
  }
}

async function notifyApplicationUpdate(user) {
  const message = 'Your application status has been updated. Please check your dashboard.';
  try {
    await sendWhatsAppMessage(user.phone, message);
  } catch (e) {
    console.log('WhatsApp failed, continue');
  }
}

module.exports = {
  notifyPaymentSuccess,
  notifyRegistrationSuccess,
  notifyApplicationUpdate,
};
