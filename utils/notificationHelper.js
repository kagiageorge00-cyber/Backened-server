const Notification = require('../models/Notification');
const Candidate = require('../models/candidate');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendWhatsAppMessage } = require('../whatsapp');
const { sendEmail } = require('../email');
const crypto = require('crypto');

function normalizePhone(value) {
  if (!value) return null;
  const phone = String(value).replace(/[\s\-()]/g, '');
  return /^\+?[0-9]{7,15}$/.test(phone) ? phone : null;
}

function normalizeEmail(value) {
  if (!value) return null;
  const email = String(value).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

async function resolveRecipient(userId) {
  if (!userId) return {};
  const id = String(userId).trim();
  const directPhone = normalizePhone(id);
  const directEmail = normalizeEmail(id);

  if (directPhone || directEmail) {
    return {
      phoneNumber: directPhone,
      email: directEmail,
    };
  }

  const query = [
    { phone: id },
    { email: id },
    { uniqueCode: id },
  ];

  if (mongoose.Types.ObjectId.isValid(id)) {
    query.push({ _id: id });
  }

  const candidate = await Candidate.findOne({ $or: query }).lean();
  if (candidate) {
    return {
      phoneNumber: normalizePhone(candidate.phone),
      email: normalizeEmail(candidate.email),
    };
  }

  const user = await User.findOne({ $or: query }).lean();
  if (user) {
    return {
      phoneNumber: normalizePhone(user.phone),
      email: normalizeEmail(user.email),
    };
  }

  return {};
}

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
  email,
  html,
}) {
  if (!userId || !title || !message) {
    throw new Error('userId, title and message are required to create a notification');
  }

  const resolved = await resolveRecipient(userId);
  const finalPhoneNumber = phoneNumber || resolved.phoneNumber;
  const finalEmail = email || resolved.email;

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

  const whatsappMessage = `📢 *${title}*\n\n${message}`;

  if (finalPhoneNumber) {
    try {
      await sendWhatsAppMessage(finalPhoneNumber, whatsappMessage);
      console.log(`✅ WhatsApp notification sent to ${finalPhoneNumber}`);
    } catch (err) {
      console.log(`⚠️ WhatsApp notification failed for ${finalPhoneNumber}: ${err.message}`);
    }
  }

  if (finalEmail) {
    try {
      const subject = `Bliss Connect: ${title}`;
      const htmlBody = html || `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 16px;">${title}</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${message}</p>
          ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Details</a>` : ''}
          <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">Bliss Connect - Connecting People to Global Opportunities</p>
        </div>
      `;
      
      await sendEmail(finalEmail, subject, message, htmlBody);
      console.log(`✅ Email notification sent to ${finalEmail}`);
    } catch (err) {
      console.log(`⚠️ Email notification failed for ${finalEmail}: ${err.message}`);
    }
  }

  return notification;
}

module.exports = {
  createNotification,
};
