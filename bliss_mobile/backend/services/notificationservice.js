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
  const portalLink = user.candidatePortalLink || `${FRONTEND_URL}/candidate-portal`;
  const marketplaceLink = user.marketplaceProfileLink || `${FRONTEND_URL}/marketplace`;
  
  setImmediate(async () => {
    try {
      await sendWhatsAppMessage(user.phone, message);
    } catch (e) {
      console.log('WhatsApp notification failed');
    }
  });

  // Send welcome email with login credentials and marketplace profile link
  if (user.email) {
    setImmediate(async () => {
      try {
        await sendEmail(
          user.email,
          'Welcome to Bliss Connect 🎉',
          `Hello ${user.name || 'there'},\n\nWelcome to Bliss Connect! 🎉\n\nYour account is ready. Use the details below to sign in to the candidate portal:\n\nCandidate ID: ${user.uniqueCode || 'N/A'}\nPassword: ${user.password || 'N/A'}\n\nLogin here: ${portalLink}\n\nYour marketplace profile is live and can be viewed here:\n${marketplaceLink}\n\nBest regards,\nBliss Connect Team`,
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1d4ed8; margin-top: 0;">Welcome to Bliss Connect 🎉</h2>
            <p>Hello ${user.name || 'there'},</p>
            <p>Your account has been created successfully. Use the login details below to access the candidate portal.</p>
            <table style="width: 100%; margin: 16px 0; font-size: 15px;">
              <tr><td style="font-weight: 600; padding: 8px 0;">Candidate ID:</td><td style="padding: 8px 0;">${user.uniqueCode || 'N/A'}</td></tr>
              <tr><td style="font-weight: 600; padding: 8px 0;">Password:</td><td style="padding: 8px 0;">${user.password || 'N/A'}</td></tr>
            </table>
            <p><a href="${portalLink}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px;">Login to Candidate Portal</a></p>
            <p style="margin-top: 20px;">Your marketplace profile is live. Employers can now view you here:</p>
            <p><a href="${marketplaceLink}" style="color: #2563eb; text-decoration: none;">View your marketplace profile</a></p>
            <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">Bliss Connect Team</p>
          </div>`
        );
      } catch (emailErr) {
        console.error('❌ Registration email failed:', emailErr.message || emailErr);
      }
    });
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
  const marketplaceLink = user.marketplaceProfileLink || `${FRONTEND_URL}/marketplace`;
  
  setImmediate(async () => {
    try {
      await sendWhatsAppMessage(user.phone, message);
    } catch (e) {
      console.log('WhatsApp notification failed');
    }
  });

  if (user.email) {
    setImmediate(async () => {
      try {
        await sendEmail(
          user.email,
          'You\'re Now on Bliss Marketplace! 🎉',
          `Hello ${user.name || 'there'},\n\nCongratulations! 🎉 You are now listed on the Bliss Connect marketplace.\n\nYour marketplace profile is live and can be viewed here:\n${marketplaceLink}\n\nEmployers can now view your profile and contact you with opportunities.\n\nBest regards,\nBliss Connect Team`,
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #16a34a; margin-top: 0;">You’re Live on Bliss Marketplace 🎉</h2>
            <p>Hello ${user.name || 'there'},</p>
            <p>Your candidate marketplace profile is now live. Employers can view your profile and reach out with opportunities.</p>
            <p><a href="${marketplaceLink}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px;">View Your Marketplace Profile</a></p>
            <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">Bliss Connect Team</p>
          </div>`
        );
      } catch (emailErr) {
        console.error('❌ Marketplace listing email failed:', emailErr.message || emailErr);
      }
    });
  }
}


module.exports = {
  notifyPaymentSuccess,
  notifyRegistrationSuccess,
  notifyApplicationUpdate,
  notifyMarketplaceListing,
};