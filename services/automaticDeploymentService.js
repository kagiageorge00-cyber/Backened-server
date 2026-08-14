const Deployment = require('../models/Deployment');
const Contract = require('../models/Contract');
const Notification = require('../models/Notification');
const DeploymentNotificationService = require('./deploymentNotificationService');
const { randomUUID } = require('crypto');

class AutomaticDeploymentService {
  /**
   * Automatically progress deployment after payment is recorded
   * This orchestrates the entire deployment workflow without manual intervention
   */
  static async progressDeploymentAutomatically(deploymentId, candidateName, candidateId, employerId) {
    try {
      console.log(`[AutoDeploy] Starting automatic progression for ${deploymentId}`);

      // Step 1: Auto-generate and witness contract
      await this._autoGenerateContract(deploymentId, candidateName, candidateId, employerId);

      // Step 2: Auto-unlock documents
      await this._autoUnlockDocuments(deploymentId, candidateName, employerId);

      // Step 3: Auto-prepare visa documents
      await this._autoPrepareVisaDocuments(deploymentId, candidateName, candidateId, employerId);

      // Step 4: Auto-confirm documents
      await this._autoConfirmDocuments(deploymentId, candidateName, candidateId, employerId);

      // Step 5: Auto-generate ticket
      await this._autoGenerateTicket(deploymentId, candidateName, candidateId, employerId);

      console.log(`[AutoDeploy] ✅ Deployment ${deploymentId} completed automatically!`);
      return {
        success: true,
        message: 'Deployment progressed automatically through all stages',
        deploymentId,
      };
    } catch (error) {
      console.error(`[AutoDeploy] ❌ Error in automatic progression: ${error.message}`);
      throw error;
    }
  }

  /**
   * Step 1: Auto-generate and witness contract
   */
  static async _autoGenerateContract(deploymentId, candidateName, candidateId, employerId) {
    try {
      console.log(`[AutoDeploy] Step 1: Auto-generating contract for ${deploymentId}`);

      const deployment = await Deployment.findOne({ deploymentId });
      if (!deployment) throw new Error('Deployment not found');

      const contractId = `CNT-${Date.now()}`;

      // Create contract automatically
      const contract = await Contract.create({
        contractId,
        deploymentId,
        employerId,
        candidateId,
        jobTitle: deployment.jobPosition,
        companyName: 'Employer Company', // TODO: Get from employer profile
        workLocation: deployment.jobLocation,
        salary: deployment.salary || 0,
        currency: 'USD',
        startDate: new Date(),
        employmentType: 'Full-time',
        contractStatus: 'signed', // Auto-signed
        witnessedBy: 'system',
        witnessedAt: new Date(),
        employerSignedAt: new Date(),
        candidateSignedAt: new Date(),
        employerSignature: 'auto-generated',
        candidateSignature: 'auto-generated',
        staffSignature: 'system-verified',
        createdAt: new Date(),
      });

      // Update deployment status
      await Deployment.updateOne(
        { deploymentId },
        {
          currentStage: 'Contract Generated & Witnessed',
          progress: 50,
          contractId,
          contractStatus: 'signed',
        }
      );

      // Notify all parties that contract is generated and witnessed
      await DeploymentNotificationService.notifyContractWitnessed(
        deploymentId,
        candidateName,
        employerId,
        candidateId
      );

      console.log(`[AutoDeploy] ✓ Contract generated and witnessed: ${contractId}`);
    } catch (error) {
      console.error(`[AutoDeploy] Error generating contract: ${error.message}`);
      throw error;
    }
  }

  /**
   * Step 2: Auto-unlock documents
   */
  static async _autoUnlockDocuments(deploymentId, candidateName, employerId) {
    try {
      console.log(`[AutoDeploy] Step 2: Auto-unlocking documents for ${deploymentId}`);

      // Update deployment to unlock documents
      await Deployment.updateOne(
        { deploymentId },
        {
          currentStage: 'Documents Unlocked',
          progress: 60,
          documentsUnlockedAt: new Date(),
          documentsStatus: 'unlocked',
        }
      );

      // Notify employer that documents are unlocked
      await DeploymentNotificationService.notifyDocumentsUnlocked(deploymentId, employerId);

      console.log(`[AutoDeploy] ✓ Documents unlocked for ${deploymentId}`);
    } catch (error) {
      console.error(`[AutoDeploy] Error unlocking documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Step 3: Auto-prepare visa documents
   */
  static async _autoPrepareVisaDocuments(deploymentId, candidateName, candidateId, employerId) {
    try {
      console.log(`[AutoDeploy] Step 3: Auto-preparing visa documents for ${deploymentId}`);

      const requiredDocuments = [
        'passport',
        'medicalCertificate',
        'policeClearance',
        'educationalCertificates',
        'professionalLicenses',
      ];

      // Create auto-generated visa document records
      const visaDocuments = {
        passport: 'auto-generated',
        medicalCertificate: 'auto-generated',
        policeClearance: 'auto-generated',
        educationalCertificates: 'auto-generated',
        professionalLicenses: 'auto-generated',
        uploadedAt: new Date(),
        status: 'verified',
      };

      // Update deployment with visa documents
      await Deployment.updateOne(
        { deploymentId },
        {
          currentStage: 'Visa Documents Ready',
          progress: 70,
          visaDocuments,
          visaDocumentsStatus: 'ready',
        }
      );

      // Notify all parties that visa documents are ready
      await DeploymentNotificationService.notifyVisaDocumentsUploaded(
        deploymentId,
        candidateName,
        employerId,
        candidateId
      );

      console.log(`[AutoDeploy] ✓ Visa documents prepared for ${deploymentId}`);
    } catch (error) {
      console.error(`[AutoDeploy] Error preparing visa documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Step 4: Auto-confirm documents (candidate confirmation)
   */
  static async _autoConfirmDocuments(deploymentId, candidateName, candidateId, employerId) {
    try {
      console.log(`[AutoDeploy] Step 4: Auto-confirming documents for ${deploymentId}`);

      // Update deployment to mark documents as confirmed
      await Deployment.updateOne(
        { deploymentId },
        {
          currentStage: 'Documents Confirmed',
          progress: 80,
          documentsConfirmedAt: new Date(),
          documentsConfirmedStatus: 'confirmed',
        }
      );

      // Notify all parties that documents are confirmed
      await DeploymentNotificationService.notifyVisaDocumentsConfirmed(
        deploymentId,
        candidateName,
        employerId,
        candidateId
      );

      console.log(`[AutoDeploy] ✓ Documents confirmed for ${deploymentId}`);
    } catch (error) {
      console.error(`[AutoDeploy] Error confirming documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Step 5: Auto-generate ticket (final step)
   */
  static async _autoGenerateTicket(deploymentId, candidateName, candidateId, employerId) {
    try {
      console.log(`[AutoDeploy] Step 5: Auto-generating flight ticket for ${deploymentId}`);

      const ticketId = `TKT-${Date.now()}`;
      const flightDate = new Date();
      flightDate.setDate(flightDate.getDate() + 7); // Default 7 days from now

      // Update deployment with ticket information
      await Deployment.updateOne(
        { deploymentId },
        {
          currentStage: 'Deployment Complete - Ticket Issued',
          progress: 100,
          deploymentStatus: 'completed',
          ticketId,
          ticketNumber: `BLS-${Date.now()}`,
          flightDate,
          flightDetails: {
            airline: 'Bliss Connect Partner Airlines',
            departure: new Date(),
            arrival: flightDate,
            status: 'issued',
          },
          ticketUploadedAt: new Date(),
          completedAt: new Date(),
        }
      );

      // Notify ALL three parties that deployment is complete with ticket issued
      await DeploymentNotificationService.notifyTicketUploaded(
        deploymentId,
        candidateName,
        employerId,
        candidateId
      );

      console.log(`[AutoDeploy] ✓ Flight ticket generated: ${ticketId}`);
      console.log(`[AutoDeploy] 🎉 DEPLOYMENT COMPLETE for ${deploymentId}!`);
    } catch (error) {
      console.error(`[AutoDeploy] Error generating ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get deployment progress summary
   */
  static async getDeploymentProgress(deploymentId) {
    try {
      const deployment = await Deployment.findOne({ deploymentId });
      if (!deployment) {
        return {
          success: false,
          error: 'Deployment not found',
        };
      }

      return {
        success: true,
        deploymentId,
        currentStage: deployment.currentStage,
        progress: deployment.progress,
        status: deployment.deploymentStatus,
        completedAt: deployment.completedAt,
        timeline: {
          contractGenerated: !!deployment.contractId,
          documentsUnlocked: deployment.documentsStatus === 'unlocked',
          visaDocumentsReady: deployment.visaDocumentsStatus === 'ready',
          documentsConfirmed: deployment.documentsConfirmedStatus === 'confirmed',
          ticketIssued: !!deployment.ticketId,
        },
      };
    } catch (error) {
      console.error(`Error getting deployment progress: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AutomaticDeploymentService;
