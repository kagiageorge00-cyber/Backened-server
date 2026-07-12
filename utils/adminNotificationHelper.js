const Notification = require('../models/Notification');
const { sendWhatsAppMessage } = require('../whatsapp');
const { sendEmail } = require('../email');

/**
 * Create admin notification
 */
async function createAdminNotification({
  title,
  message,
  category = 'support',
  entityType,
  entityId,
  candidateName,
  employerName,
  candidateCode,
  candidatePassword,
  marketplaceLink,
  amount,
  currency = 'KES',
  actionUrl,
  adminPhoneNumber,
  adminEmail
}) {
  try {
    const notificationId = `NOT-${Date.now()}-${Math.round(Math.random() * 10000)}`;
    
    const notification = await Notification.create({
      notificationId,
      userId: 'admin',
      userType: 'admin',
      title,
      message,
      category,
      entityType,
      entityId,
      candidateName,
      employerName,
      candidateCode,
      candidatePassword,
      marketplaceLink,
      amount,
      currency,
      actionUrl,
      notificationType: category,
      isRead: false,
    });

    // Send WhatsApp notification to admin if phone number is provided
    if (adminPhoneNumber) {
      try {
        const whatsappMessage = `🔔 *${title}*\n\n${message}`;
        await sendWhatsAppMessage(adminPhoneNumber, whatsappMessage);
        console.log(`✅ Admin WhatsApp notification sent to ${adminPhoneNumber}`);
      } catch (err) {
        console.log(`⚠️ Admin WhatsApp notification failed: ${err.message}`);
        // Don't fail - notification is still created in database
      }
    }

    // Send email notification to admin if email is provided
    if (adminEmail) {
      try {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 16px;">🔔 ${title}</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${message}</p>
            ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">View in Admin Panel</a>` : ''}
            <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">Bliss Connect Admin - ${new Date().toLocaleString()}</p>
          </div>
        `;
        
        await sendEmail(adminEmail, `[ADMIN] ${title}`, message, htmlContent);
        console.log(`✅ Admin email notification sent to ${adminEmail}`);
      } catch (err) {
        console.log(`⚠️ Admin email notification failed: ${err.message}`);
        // Don't fail - notification is still created in database
      }
    }

    return notification;
  } catch (err) {
    console.error('❌ Error creating admin notification:', err.message);
    return null;
  }
}

/**
 * Payment notifications
 */
async function notifyPaymentSubmitted({ candidateName, amount, currency = 'KES', paymentId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Payment Submitted',
    message: `Payment of ${currency} ${amount} submitted by ${candidateName}`,
    category: 'payment',
    entityType: 'payment',
    entityId: paymentId,
    candidateName,
    amount,
    currency,
    actionUrl: `/admin/payments/${paymentId}`,
    adminPhoneNumber,
    adminEmail
  });
}

async function notifyPaymentApproved({ candidateName, amount, currency = 'KES', paymentId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Payment Approved',
    message: `Payment of ${currency} ${amount} from ${candidateName} approved successfully`,
    category: 'payment',
    entityType: 'payment',
    entityId: paymentId,
    candidateName,
    amount,
    currency,
    actionUrl: `/admin/payments/${paymentId}`,
    adminPhoneNumber,
    adminEmail
  });
}

async function notifyPaymentRejected({ candidateName, amount, currency = 'KES', paymentId, reason, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Payment Rejected',
    message: `Payment of ${currency} ${amount} from ${candidateName} rejected${reason ? ': ' + reason : ''}`,
    category: 'payment',
    entityType: 'payment',
    entityId: paymentId,
    candidateName,
    amount,
    currency,
    actionUrl: `/admin/payments/${paymentId}`,
    adminPhoneNumber,
    adminEmail
  });
}

/**
 * Interview notifications
 */
async function notifyInterviewRequested({ employerName, candidateName, interviewDate, interviewId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Interview Requested',
    message: `${employerName} requested interview with ${candidateName}`,
    category: 'interview',
    entityType: 'interview',
    entityId: interviewId,
    employerName,
    candidateName,
    actionUrl: `/admin/interviews/${interviewId}`,
    adminPhoneNumber,
    adminEmail
  });
}

async function notifyInterviewAccepted({ candidateName, employerName, interviewId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Interview Accepted',
    message: `${candidateName} accepted interview from ${employerName}`,
    category: 'interview',
    entityType: 'interview',
    entityId: interviewId,
    candidateName,
    employerName,
    actionUrl: `/admin/interviews/${interviewId}`,
    adminPhoneNumber,
    adminEmail
  });
}

async function notifyInterviewCompleted({ candidateName, employerName, interviewId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Interview Completed',
    message: `Interview between ${employerName} and ${candidateName} completed`,
    category: 'interview',
    entityType: 'interview',
    entityId: interviewId,
    candidateName,
    employerName,
    actionUrl: `/admin/interviews/${interviewId}`,
    adminPhoneNumber,
    adminEmail
  });
}

/**
 * Deployment notifications
 */
async function notifyDeploymentCreated({ candidateName, employerName, deploymentId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Deployment Created',
    message: `New deployment: ${candidateName} to ${employerName}`,
    category: 'deployment',
    entityType: 'deployment',
    entityId: deploymentId,
    candidateName,
    employerName,
    actionUrl: `/admin/deployments/${deploymentId}`,
    adminPhoneNumber,
    adminEmail
  });
}

async function notifyDeploymentCompleted({ candidateName, employerName, deploymentId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Deployment Completed',
    message: `${candidateName} completed deployment with ${employerName}`,
    category: 'deployment',
    entityType: 'deployment',
    entityId: deploymentId,
    candidateName,
    employerName,
    actionUrl: `/admin/deployments/${deploymentId}`,
    adminPhoneNumber,
    adminEmail
  });
}

/**
 * Contract notifications
 */
async function notifyContractUploaded({ candidateName, contractId, deploymentId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Contract Uploaded',
    message: `Contract uploaded by ${candidateName}`,
    category: 'contract',
    entityType: 'contract',
    entityId: contractId,
    candidateName,
    actionUrl: `/admin/contracts/${contractId}`,
    adminPhoneNumber,
    adminEmail
  });
}

async function notifyContractSigned({ candidateName, contractId, deploymentId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Contract Signed',
    message: `Contract signed by ${candidateName}`,
    category: 'contract',
    entityType: 'contract',
    entityId: contractId,
    candidateName,
    actionUrl: `/admin/contracts/${contractId}`,
    adminPhoneNumber,
    adminEmail
  });
}

/**
 * Visa notifications
 */
async function notifyVisaUploaded({ candidateName, visaId, deploymentId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Visa Document Uploaded',
    message: `Visa document uploaded by ${candidateName}`,
    category: 'visa',
    entityType: 'visa',
    entityId: visaId,
    candidateName,
    actionUrl: `/admin/visas/${visaId}`,
    adminPhoneNumber,
    adminEmail
  });
}

/**
 * Ticket notifications
 */
async function notifyTicketUploaded({ candidateName, ticketId, deploymentId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Travel Ticket Uploaded',
    message: `Travel ticket uploaded by ${candidateName}`,
    category: 'ticket',
    entityType: 'ticket',
    entityId: ticketId,
    candidateName,
    actionUrl: `/admin/tickets/${ticketId}`,
    adminPhoneNumber,
    adminEmail
  });
}

/**
 * Message notifications
 */
async function notifyMessageReceived({ senderName, senderType, messageId, conversationId, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: `Message from ${senderType === 'candidate' ? 'Candidate' : 'Employer'}`,
    message: `New message from ${senderName}`,
    category: 'message',
    entityType: 'message',
    entityId: messageId,
    candidateName: senderType === 'candidate' ? senderName : undefined,
    employerName: senderType === 'employer' ? senderName : undefined,
    actionUrl: `/admin/messages/${conversationId}`,
    adminPhoneNumber,
    adminEmail
  });
}

/**
 * Support/Ticket notifications
 */
async function notifySupportTicketCreated({ candidateName, ticketId, subject, adminPhoneNumber, adminEmail }) {
  return createAdminNotification({
    title: 'Support Ticket Created',
    message: `${candidateName} created support ticket: ${subject}`,
    category: 'support',
    entityType: 'support_ticket',
    entityId: ticketId,
    candidateName,
    actionUrl: `/admin/support/${ticketId}`,
    adminPhoneNumber,
    adminEmail
  });
}

async function notifyCandidateRegistered({ candidateName, phone, candidateCode, candidatePassword, marketplaceLink, adminPhoneNumber, adminEmail }) {
  const passwordMessage = candidatePassword ? `Password: ${candidatePassword}.` : 'Password unchanged.';
  return createAdminNotification({
    title: 'Candidate Registered',
    message: `Candidate ${candidateName || phone} registered. Code: ${candidateCode}. ${passwordMessage} Marketplace: ${marketplaceLink}`,
    category: 'candidate',
    entityType: 'candidate',
    entityId: candidateCode || phone,
    candidateName,
    candidateCode,
    candidatePassword,
    marketplaceLink,
    actionUrl: `/admin/marketplace?candidate=${encodeURIComponent(candidateCode || phone)}`,
    adminPhoneNumber,
    adminEmail
  });
}

module.exports = {
  createAdminNotification,
  notifyPaymentSubmitted,
  notifyPaymentApproved,
  notifyPaymentRejected,
  notifyInterviewRequested,
  notifyInterviewAccepted,
  notifyInterviewCompleted,
  notifyDeploymentCreated,
  notifyDeploymentCompleted,
  notifyContractUploaded,
  notifyContractSigned,
  notifyVisaUploaded,
  notifyTicketUploaded,
  notifyMessageReceived,
  notifySupportTicketCreated,
  notifyCandidateRegistered,
};
