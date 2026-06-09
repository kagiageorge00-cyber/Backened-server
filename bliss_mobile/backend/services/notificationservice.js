const { sendWhatsAppMessage } = require('../whatsapp');
const { sendEmail } = require('../email');
const { FRONTEND_URL } = require('../config');

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

// ===============================================
// PAYMENT SUCCESS NOTIFICATION (EMAIL + WhatsApp)
// ===============================================
async function notifyPaymentSuccess(user) {
  const message = 'Hello 👋, your payment has been received successfully. Your application is now being processed.';
  
  // Fire-and-forget: send both WhatsApp and email without waiting
  setImmediate(async () => {
    try {
      // Try WhatsApp
      await sendWhatsAppMessage(user.phone, message);
    } catch (e) {
      console.log('WhatsApp notification failed, continuing with email');
    }
  });

  // Send email with candidate form link
  if (user.email) {
    // link using phone param — uniqueCode may not exist yet
    const candidateFormLink = user.phone
      ? `${FRONTEND_URL}/candidate-form?phone=${encodeURIComponent(user.phone)}`
      : `${FRONTEND_URL}/candidate-form`;
    sendEmail(
      user.email,
      'Payment Received - Complete Your Form ✅',
      `Hello ${user.name || 'there'},\n\nYour payment has been received successfully! ✅\n\nNext step: Complete your candidate form to get verified:\n${candidateFormLink}\n\nBest regards,\nBliss Connect Team`
    );
  }
}

// ===============================================
// REGISTRATION SUCCESS NOTIFICATION
// ===============================================
async function notifyRegistrationSuccess(user) {
  const message = user.message || 'Welcome to Bliss Connect 🎉. Your account has been created successfully.';
  
  setImmediate(async () => {
    try {
      await sendWhatsAppMessage(user.phone, message);
    } catch (e) {
      console.log('WhatsApp notification failed');
    }
  });

  // Send welcome email
  if (user.email) {
    sendEmail(
      user.email,
      'Welcome to Bliss Connect 🎉',
      `Hello ${user.name || 'there'},\n\nWelcome to Bliss Connect! 🎉\n\nYour account has been created successfully.\n\nNext steps:\n1. Complete your payment\n2. Fill out your candidate form\n3. Get matched with opportunities\n\nBest regards,\nBliss Connect Team`
    );
  }
}

// ===============================================
// APPLICATION UPDATE NOTIFICATION
// ===============================================
async function notifyApplicationUpdate(user) {
  const message = 'Your application status has been updated. Please check your dashboard.';
  
  setImmediate(async () => {
    try {
      await sendWhatsAppMessage(user.phone, message);
    } catch (e) {
      console.log('WhatsApp notification failed');
    }
  });

  if (user.email) {
    sendEmail(
      user.email,
      'Application Status Update - Bliss Connect 📋',
      `Hello ${user.name || 'there'},\n\nYour application status has been updated!\n\nPlease check your dashboard for more details.\n\nBest regards,\nBliss Connect Team`
    );
  }
}

// ===============================================
// MARKETPLACE LISTING NOTIFICATION
// ===============================================
async function notifyMarketplaceListing(user) {
  const message = 'Congratulations! 🎉 You are now listed on the Bliss Connect marketplace. Employers can now view your profile.';
  
  setImmediate(async () => {
    try {
      await sendWhatsAppMessage(user.phone, message);
    } catch (e) {
      console.log('WhatsApp notification failed');
    }
  });

  if (user.email) {
    sendEmail(
      user.email,
      'You\'re Now on Bliss Marketplace! 🎉',
      `Hello ${user.name || 'there'},\n\nCongratulations! 🎉 You are now listed on the Bliss Connect marketplace.\n\nEmployers can now view your profile and contact you with opportunities.\n\nBest regards,\nBliss Connect Team`
    );
  }
}

module.exports = {
  notifyPaymentSuccess,
  notifyRegistrationSuccess,
  notifyApplicationUpdate,
  notifyMarketplaceListing,
};