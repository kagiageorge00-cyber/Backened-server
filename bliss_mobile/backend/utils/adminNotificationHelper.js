const Notification = require('../models/Notification');

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
  actionUrl
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

    return notification;
  } catch (err) {
    console.error('❌ Error creating admin notification:', err.message);
    return null;
  }
}

/**
 * Payment notifications
 */
async function notifyPaymentSubmitted({ candidateName, amount, currency = 'KES', paymentId }) {
  return createAdminNotification({
    title: 'Payment Submitted',
    message: `Payment of ${currency} ${amount} submitted by ${candidateName}`,
    category: 'payment',
    entityType: 'payment',
    entityId: paymentId,
    candidateName,
    amount,
    currency,
    actionUrl: `/admin/payments/${paymentId}`
  });
}

async function notifyPaymentApproved({ candidateName, amount, currency = 'KES', paymentId }) {
  return createAdminNotification({
    title: 'Payment Approved',
    message: `Payment of ${currency} ${amount} from ${candidateName} approved successfully`,
    category: 'payment',
    entityType: 'payment',
    entityId: paymentId,
    candidateName,
    amount,
    currency,
    actionUrl: `/admin/payments/${paymentId}`
  });
}

async function notifyPaymentRejected({ candidateName, amount, currency = 'KES', paymentId, reason }) {
  return createAdminNotification({
    title: 'Payment Rejected',
    message: `Payment of ${currency} ${amount} from ${candidateName} rejected${reason ? ': ' + reason : ''}`,
    category: 'payment',
    entityType: 'payment',
    entityId: paymentId,
    candidateName,
    amount,
    currency,
    actionUrl: `/admin/payments/${paymentId}`
  });
}

/**
 * Interview notifications
 */
async function notifyInterviewRequested({ employerName, candidateName, interviewDate, interviewId }) {
  return createAdminNotification({
    title: 'Interview Requested',
    message: `${employerName} requested interview with ${candidateName}`,
    category: 'interview',
    entityType: 'interview',
    entityId: interviewId,
    employerName,
    candidateName,
    actionUrl: `/admin/interviews/${interviewId}`
  });
}

async function notifyInterviewAccepted({ candidateName, employerName, interviewId }) {
  return createAdminNotification({
    title: 'Interview Accepted',
    message: `${candidateName} accepted interview from ${employerName}`,
    category: 'interview',
    entityType: 'interview',
    entityId: interviewId,
    candidateName,
    employerName,
    actionUrl: `/admin/interviews/${interviewId}`
  });
}

async function notifyInterviewCompleted({ candidateName, employerName, interviewId }) {
  return createAdminNotification({
    title: 'Interview Completed',
    message: `Interview between ${employerName} and ${candidateName} completed`,
    category: 'interview',
    entityType: 'interview',
    entityId: interviewId,
    candidateName,
    employerName,
    actionUrl: `/admin/interviews/${interviewId}`
  });
}

/**
 * Deployment notifications
 */
async function notifyDeploymentCreated({ candidateName, employerName, deploymentId }) {
  return createAdminNotification({
    title: 'Deployment Created',
    message: `New deployment: ${candidateName} to ${employerName}`,
    category: 'deployment',
    entityType: 'deployment',
    entityId: deploymentId,
    candidateName,
    employerName,
    actionUrl: `/admin/deployments/${deploymentId}`
  });
}

async function notifyDeploymentCompleted({ candidateName, employerName, deploymentId }) {
  return createAdminNotification({
    title: 'Deployment Completed',
    message: `${candidateName} completed deployment with ${employerName}`,
    category: 'deployment',
    entityType: 'deployment',
    entityId: deploymentId,
    candidateName,
    employerName,
    actionUrl: `/admin/deployments/${deploymentId}`
  });
}

/**
 * Contract notifications
 */
async function notifyContractUploaded({ candidateName, contractId, deploymentId }) {
  return createAdminNotification({
    title: 'Contract Uploaded',
    message: `Contract uploaded by ${candidateName}`,
    category: 'contract',
    entityType: 'contract',
    entityId: contractId,
    candidateName,
    actionUrl: `/admin/contracts/${contractId}`
  });
}

async function notifyContractSigned({ candidateName, contractId, deploymentId }) {
  return createAdminNotification({
    title: 'Contract Signed',
    message: `Contract signed by ${candidateName}`,
    category: 'contract',
    entityType: 'contract',
    entityId: contractId,
    candidateName,
    actionUrl: `/admin/contracts/${contractId}`
  });
}

/**
 * Visa notifications
 */
async function notifyVisaUploaded({ candidateName, visaId, deploymentId }) {
  return createAdminNotification({
    title: 'Visa Document Uploaded',
    message: `Visa document uploaded by ${candidateName}`,
    category: 'visa',
    entityType: 'visa',
    entityId: visaId,
    candidateName,
    actionUrl: `/admin/visas/${visaId}`
  });
}

/**
 * Ticket notifications
 */
async function notifyTicketUploaded({ candidateName, ticketId, deploymentId }) {
  return createAdminNotification({
    title: 'Travel Ticket Uploaded',
    message: `Travel ticket uploaded by ${candidateName}`,
    category: 'ticket',
    entityType: 'ticket',
    entityId: ticketId,
    candidateName,
    actionUrl: `/admin/tickets/${ticketId}`
  });
}

/**
 * Message notifications
 */
async function notifyMessageReceived({ senderName, senderType, messageId, conversationId }) {
  return createAdminNotification({
    title: `Message from ${senderType === 'candidate' ? 'Candidate' : 'Employer'}`,
    message: `New message from ${senderName}`,
    category: 'message',
    entityType: 'message',
    entityId: messageId,
    candidateName: senderType === 'candidate' ? senderName : undefined,
    employerName: senderType === 'employer' ? senderName : undefined,
    actionUrl: `/admin/messages/${conversationId}`
  });
}

/**
 * Support/Ticket notifications
 */
async function notifySupportTicketCreated({ candidateName, ticketId, subject }) {
  return createAdminNotification({
    title: 'Support Ticket Created',
    message: `${candidateName} created support ticket: ${subject}`,
    category: 'support',
    entityType: 'support_ticket',
    entityId: ticketId,
    candidateName,
    actionUrl: `/admin/support/${ticketId}`
  });
}

async function notifyCandidateRegistered({ candidateName, phone, candidateCode, candidatePassword, marketplaceLink }) {
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
    actionUrl: `/admin/marketplace?candidate=${encodeURIComponent(candidateCode || phone)}`
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
