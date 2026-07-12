const Notification = require('../models/Notification');
const { sendWhatsAppMessage } = require('../whatsapp');
const { sendEmail } = require('../email');
const crypto = require('crypto');

async function createNotification({ 
  userId, 
  title, 
  message, 
  type, 
  actionUrl, 
  userType = 'candidate',
  category = 'support',
  entityType,
  entityId,
  candidateName,
  employerName,
  amount,
  currency = 'KES',
  phoneNumber,
  email
}) {
  if (!userId || !title || !message) {
    throw new Error('userId, title and message are required to create a notification');
  }

  const notificationId = `NOT-${Date.now()}-${Math.round(Math.random() * 10000)}`;
  
  // Create database notification
  const notification = await Notification.create({
    notificationId,
    userId,
    userType,
    title,
    message,
    notificationType: type,
    category,
    actionUrl,
    entityType,
    entityId,
    candidateName,
    employerName,
    amount,
    currency,
  });

  // Send WhatsApp notification if phone number is provided
  if (phoneNumber) {
    try {
      const whatsappMessage = `📢 *${title}*\n\n${message}`;
      await sendWhatsAppMessage(phoneNumber, whatsappMessage);
      console.log(`✅ WhatsApp notification sent to ${phoneNumber}`);
    } catch (err) {
      console.log(`⚠️ WhatsApp notification failed for ${phoneNumber}: ${err.message}`);
      // Don't fail - notification is still created in database
    }
  }

  // Send email notification if email is provided
  if (email) {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 16px;">${title}</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${message}</p>
          ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Details</a>` : ''}
          <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">Bliss Connect - Connecting People to Global Opportunities</p>
        </div>
      `;
      
      await sendEmail(email, `Bliss Connect: ${title}`, message, htmlContent);
      console.log(`✅ Email notification sent to ${email}`);
    } catch (err) {
      console.log(`⚠️ Email notification failed for ${email}: ${err.message}`);
      // Don't fail - notification is still created in database
    }
  }

  return notification;
}

module.exports = {
  createNotification,
};
