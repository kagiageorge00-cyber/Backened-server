const Notification = require('../models/Notification');
const Deployment = require('../models/Deployment');
const Candidate = require('../models/candidate');
const Employer = require('../models/Employer');

class DeploymentNotificationService {
  /**
   * Stage: PAYMENT_RECEIVED
   * Staff receives payment receipt for verification
   */
  static async notifyPaymentReceived(deploymentId, staffId) {
    try {
      const deployment = await Deployment.findOne({ deploymentId });
      if (!deployment) throw new Error('Deployment not found');

      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: staffId,
        userType: 'staff',
        title: 'Payment Received - Manual Verification Required',
        message: `Payment received for ${deployment.candidateName} (${deployment.jobPosition}). Amount: $${deployment.deploymentFee.toFixed(2)}. Please verify and approve.`,
        notificationType: 'action_required',
        category: 'payment_verification',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/staff/deployments/${deploymentId}/verify-payment`,
        createdAt: new Date(),
      });

      console.log(`Payment received notification sent to staff: ${staffId}`);
    } catch (err) {
      console.error('Error notifying payment received:', err);
    }
  }

  /**
   * Stage: PAYMENT_APPROVED
   * Employer receives approval to proceed with contract
   * Candidate receives confirmation notification
   */
  static async notifyPaymentApproved(deploymentId, candidateName, employerId, candidateId) {
    try {
      // Notify Employer
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: employerId,
        userType: 'employer',
        title: 'Payment Approved ✓',
        message: `Your payment has been verified and approved. You can now proceed to generate the employment contract with ${candidateName}.`,
        notificationType: 'success',
        category: 'payment_approved',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/employer/deployments/${deploymentId}/generate-contract`,
        createdAt: new Date(),
      });

      // Notify Candidate
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: candidateId,
        userType: 'candidate',
        title: 'Deployment Payment Confirmed',
        message: 'Great news! Your deployment payment has been confirmed. Contract generation will begin shortly.',
        notificationType: 'info',
        category: 'payment_approved',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/candidate/deployments/${deploymentId}`,
        createdAt: new Date(),
      });

      console.log(`Payment approved notifications sent to employer: ${employerId} and candidate: ${candidateId}`);
    } catch (err) {
      console.error('Error notifying payment approved:', err);
    }
  }

  /**
   * Stage: CONTRACT_UPLOADED
   * Staff notified of upload
   * Other party notified to upload their version
   */
  static async notifyContractUploaded(
    deploymentId,
    uploaderType,
    uploaderName,
    uploaderIdToSkip,
    staffId,
  ) {
    try {
      const deployment = await Deployment.findOne({ deploymentId });
      if (!deployment) throw new Error('Deployment not found');

      // Notify Staff
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: staffId,
        userType: 'staff',
        title: `Contract Uploaded by ${uploaderName}`,
        message: `${uploaderType} has uploaded their version of the employment contract. Awaiting other party...`,
        notificationType: 'info',
        category: 'contract_uploaded',
        priority: 'medium',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/staff/deployments/${deploymentId}/review-contract`,
        createdAt: new Date(),
      });

      // Notify Other Party (Candidate if Employer uploaded, Employer if Candidate uploaded)
      const otherPartyId = uploaderType === 'employer' ? deployment.candidateId : deployment.employerId;
      const otherPartyType = uploaderType === 'employer' ? 'candidate' : 'employer';

      if (otherPartyId && otherPartyId !== uploaderIdToSkip) {
        await Notification.create({
          notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: otherPartyId,
          userType: otherPartyType,
          title: `${uploaderName} Uploaded Contract`,
          message: `${uploaderName} has uploaded the employment contract. Please review and upload your version.`,
          notificationType: 'action_required',
          category: 'contract_upload_required',
          priority: 'high',
          entityType: 'deployment',
          entityId: deploymentId,
          actionUrl: `/shared/deployments/${deploymentId}/contract-review`,
          createdAt: new Date(),
        });
      }

      console.log(`Contract uploaded notifications sent for deployment: ${deploymentId}`);
    } catch (err) {
      console.error('Error notifying contract uploaded:', err);
    }
  }

  /**
   * Stage: CONTRACT_WITNESSED
   * All three parties notified
   * Staff and Employer get action items
   */
  static async notifyContractWitnessed(deploymentId, candidateName, staffId, employerId, candidateId) {
    try {
      // Notify Staff
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: staffId,
        userType: 'staff',
        title: 'Contract Witnessed & Approved',
        message: `Employment contract for ${candidateName} has been witnessed and is now approved. Documents will unlock shortly.`,
        notificationType: 'success',
        category: 'contract_witnessed',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/staff/deployments/${deploymentId}`,
        createdAt: new Date(),
      });

      // Notify Employer
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: employerId,
        userType: 'employer',
        title: 'Contract Approved ✓',
        message: `The employment contract for ${candidateName} has been approved. You can now upload visa documents.`,
        notificationType: 'action_required',
        category: 'documents_upload_required',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/employer/deployments/${deploymentId}/upload-documents`,
        createdAt: new Date(),
      });

      // Notify Candidate
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: candidateId,
        userType: 'candidate',
        title: 'Employment Contract Approved',
        message: 'Your employment contract has been reviewed and approved. Your visa documents will soon be available.',
        notificationType: 'success',
        category: 'contract_witnessed',
        priority: 'medium',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/candidate/deployments/${deploymentId}`,
        createdAt: new Date(),
      });

      console.log(
        `Contract witnessed notifications sent to staff: ${staffId}, employer: ${employerId}, candidate: ${candidateId}`,
      );
    } catch (err) {
      console.error('Error notifying contract witnessed:', err);
    }
  }

  /**
   * Stage: DOCUMENTS_UNLOCKED
   * Employer notified to download and use documents
   */
  static async notifyDocumentsUnlocked(deploymentId, candidateName, employerId) {
    try {
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: employerId,
        userType: 'employer',
        title: 'Candidate Documents Available',
        message: `Documents for ${candidateName} are now available. Please download and use them for visa application.`,
        notificationType: 'action_required',
        category: 'visa_documents_available',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/employer/deployments/${deploymentId}/documents`,
        createdAt: new Date(),
      });

      console.log(`Documents unlocked notification sent to employer: ${employerId}`);
    } catch (err) {
      console.error('Error notifying documents unlocked:', err);
    }
  }

  /**
   * Stage: VISA_DOCUMENTS_UPLOADED
   * Candidate notified to confirm
   * Staff notified to review
   * Employer notified of submission
   */
  static async notifyVisaDocumentsUploaded(
    deploymentId,
    candidateName,
    candidateId,
    staffId,
    employerId,
    employerName,
  ) {
    try {
      // Notify Candidate
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: candidateId,
        userType: 'candidate',
        title: 'Visa Documents Uploaded',
        message: `${employerName} has uploaded your visa documents. Please review and confirm they are correct.`,
        notificationType: 'action_required',
        category: 'visa_documents_confirm_required',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/candidate/deployments/${deploymentId}/confirm-documents`,
        createdAt: new Date(),
      });

      // Notify Staff
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: staffId,
        userType: 'staff',
        title: 'Visa Documents Submitted',
        message: `${employerName} has uploaded visa documents for ${candidateName}. Awaiting candidate confirmation.`,
        notificationType: 'info',
        category: 'visa_documents_submitted',
        priority: 'medium',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/staff/deployments/${deploymentId}/review-documents`,
        createdAt: new Date(),
      });

      // Notify Employer
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: employerId,
        userType: 'employer',
        title: 'Visa Documents Submitted',
        message: `Your visa documents for ${candidateName} have been uploaded. Awaiting candidate and staff confirmation.`,
        notificationType: 'info',
        category: 'visa_documents_submitted',
        priority: 'medium',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/employer/deployments/${deploymentId}`,
        createdAt: new Date(),
      });

      console.log(
        `Visa documents uploaded notifications sent to candidate: ${candidateId}, staff: ${staffId}, employer: ${employerId}`,
      );
    } catch (err) {
      console.error('Error notifying visa documents uploaded:', err);
    }
  }

  /**
   * Stage: VISA_DOCUMENTS_CONFIRMED
   * Staff notified to proceed with visa
   * Employer and Candidate notified of confirmation
   */
  static async notifyVisaDocumentsConfirmed(deploymentId, candidateName, candidateId, staffId, employerId) {
    try {
      // Notify Staff
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: staffId,
        userType: 'staff',
        title: 'Visa Documents Confirmed',
        message: `${candidateName} has confirmed all visa documents. Ready to proceed with visa application.`,
        notificationType: 'action_required',
        category: 'visa_application_ready',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/staff/deployments/${deploymentId}/submit-visa`,
        createdAt: new Date(),
      });

      // Notify Employer
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: employerId,
        userType: 'employer',
        title: 'Visa Documents Confirmed',
        message: `${candidateName} has confirmed all visa documents. Staff will proceed with visa application.`,
        notificationType: 'success',
        category: 'visa_documents_confirmed',
        priority: 'medium',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/employer/deployments/${deploymentId}`,
        createdAt: new Date(),
      });

      // Notify Candidate
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: candidateId,
        userType: 'candidate',
        title: 'Documents Confirmed',
        message: 'You have successfully confirmed your visa documents. Staff will now proceed with the visa application.',
        notificationType: 'success',
        category: 'visa_documents_confirmed',
        priority: 'medium',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/candidate/deployments/${deploymentId}`,
        createdAt: new Date(),
      });

      console.log(
        `Visa documents confirmed notifications sent to staff: ${staffId}, employer: ${employerId}, candidate: ${candidateId}`,
      );
    } catch (err) {
      console.error('Error notifying visa documents confirmed:', err);
    }
  }

  /**
   * Stage: TICKET_UPLOADED
   * All three parties notified - deployment ready!
   */
  static async notifyTicketUploaded(
    deploymentId,
    candidateName,
    flightDate,
    candidateId,
    staffId,
    employerId,
  ) {
    try {
      const message = `Flight ticket for ${candidateName} has been uploaded. Departure: ${flightDate}. Deployment is approved!`;

      // Notify Staff
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: staffId,
        userType: 'staff',
        title: 'Flight Ticket Uploaded - Deployment Ready ✓',
        message,
        notificationType: 'success',
        category: 'deployment_ready',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/staff/deployments/${deploymentId}`,
        createdAt: new Date(),
      });

      // Notify Employer
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: employerId,
        userType: 'employer',
        title: 'Flight Ticket Ready - Deployment Approved ✓',
        message,
        notificationType: 'success',
        category: 'deployment_ready',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/employer/deployments/${deploymentId}`,
        createdAt: new Date(),
      });

      // Notify Candidate
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: candidateId,
        userType: 'candidate',
        title: 'Flight Ticket Ready - Let\'s Go! ✈️',
        message,
        notificationType: 'success',
        category: 'deployment_ready',
        priority: 'high',
        entityType: 'deployment',
        entityId: deploymentId,
        actionUrl: `/candidate/deployments/${deploymentId}`,
        createdAt: new Date(),
      });

      console.log(
        `Ticket uploaded notifications sent to staff: ${staffId}, employer: ${employerId}, candidate: ${candidateId}`,
      );
    } catch (err) {
      console.error('Error notifying ticket uploaded:', err);
    }
  }
}

module.exports = DeploymentNotificationService;
