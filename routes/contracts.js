const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const Deployment = require('../models/Deployment');
const Candidate = require('../models/candidate');
const Notification = require('../models/Notification');
const employerAuth = require('../middleware/employerAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const signatureStorage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'signatures');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const signatureUpload = multer({
  storage: signatureStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const { generateContractPdf } = require('../services/contractService');

router.use(employerAuth);

// Generate contract
router.post('/generate', async (req, res) => {
  try {
    const employer = req.employer;
    const {
      deploymentId,
      companyName,
      jobDescription,
      salary,
    } = req.body;

    if (!deploymentId || !companyName || !jobDescription || !salary) {
      return res.status(400).json({
        success: false,
        error: 'deploymentId, companyName, jobDescription, and salary required',
      });
    }

    const deployment = await Deployment.findOne({ deploymentId });
    if (!deployment) {
      return res
        .status(404)
        .json({ success: false, error: 'Deployment not found' });
    }

    if (deployment.employerId !== employer.employerId) {
      return res
        .status(403)
        .json({ success: false, error: 'Employer access denied' });
    }

    const candidate = await Candidate.findOne({
      $or: [
        { candidateId: deployment.candidateId },
        { uniqueCode: deployment.candidateId },
        { phone: deployment.candidateId },
        { email: deployment.candidateId },
      ],
    });

    if (!candidate) {
      return res
        .status(404)
        .json({ success: false, error: 'Candidate not found' });
    }

    const contractId = `CNT-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const contract = new Contract({
      contractId,
      deploymentId,
      employerId: employer.employerId,
      candidateId: deployment.candidateId,
      candidateName: candidate.firstName + ' ' + (candidate.lastName || ''),
      employerName: employer.companyName || employer.firstName,
      companyName,
      jobPosition: deployment.jobPosition || 'Position TBD',
      jobDescription,
      jobCountry: deployment.candidateCountry || 'Not specified',
      salary: parseFloat(salary),
      contractPeriodYears: 2,
      contractStatus: 'pending_employer_signature',
      contractUrl: `/uploads/contracts/${contractId}.pdf`,
    });

    await contract.save();

    // Audit: contract generated
    try {
      const audit = require('../middleware/audit');
      // create a lightweight log entry
      const ActivityLog = require('../models/ActivityLog');
      await ActivityLog.create({ actorId: employer.employerId, actorType: 'employer', action: 'generate_contract', entityType: 'contract', entityId: contractId, details: { deploymentId } });
    } catch (e) {
      console.warn('Audit create failed:', e.message || e);
    }

    // Generate PDF file for contract and update contractUrl if successful
    try {
      const { filePath, fileName } = await generateContractPdf(contract.toObject());
      contract.contractUrl = `/uploads/contracts/${fileName}`;
      await contract.save();
    } catch (pdfErr) {
      console.warn('Contract PDF generation failed:', pdfErr.message || pdfErr);
    }

    // Create notification for employer
    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      userId: employer.employerId,
      userType: 'employer',
      title: 'Contract Generated',
      message: `Employment contract for ${candidate.firstName} has been generated. Please review and sign.`,
      notificationType: 'contract',
      category: 'contract_created',
      entityType: 'contract',
      entityId: contractId,
      actionUrl: `/employer/contracts/${contractId}`,
    });

    // Create notification for candidate
    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      userId: candidate._id.toString(),
      userType: 'candidate',
      title: 'Contract Ready for Review',
      message: `An employment contract is ready for your review and signature.`,
      notificationType: 'contract',
      category: 'contract_created',
      entityType: 'contract',
      entityId: contractId,
      actionUrl: `/candidate/contracts/${contractId}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Contract generated successfully',
      contract: contract.toObject(),
    });
  } catch (err) {
    console.error('Contract generation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Upload contract signature
router.post('/:contractId/sign', signatureUpload.single('signatureFile'), async (req, res) => {
  try {
    const employer = req.employer;
    const { contractId } = req.params;
    const { signatureType } = req.body; // 'employer' or 'candidate'

    if (!contractId || !signatureType || !req.file) {
      return res.status(400).json({
        success: false,
        error: 'contractId, signatureType, and signatureFile required',
      });
    }

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res
        .status(404)
        .json({ success: false, error: 'Contract not found' });
    }

    // Verify access: employer can sign employer contract, candidate can sign candidate contract
    if (signatureType === 'employer' && contract.employerId !== employer.employerId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const signaturePath = `/uploads/signatures/${req.file.filename}`;

    if (signatureType === 'employer') {
      contract.employerSignatureUrl = signaturePath;
      contract.employerSigned = true;
      contract.employerSignedAt = new Date();
      contract.contractStatus = 'pending_candidate_signature';
    } else if (signatureType === 'candidate') {
      contract.candidateSignatureUrl = signaturePath;
      contract.candidateSigned = true;
      contract.candidateSignedAt = new Date();
      
      if (contract.employerSigned) {
        contract.contractStatus = 'pending_manager_signature';
      }
    }

    await contract.save();

    // Audit signature upload
    try {
      const ActivityLog = require('../models/ActivityLog');
      const actorId = employer ? employer.employerId : (req.body.userId || 'unknown');
      await ActivityLog.create({ actorId, actorType: signatureType === 'employer' ? 'employer' : 'candidate', action: 'upload_signature', entityType: 'contract', entityId: contractId, details: { signatureType } });
    } catch (e) {
      console.warn('Audit signature failed:', e.message || e);
    }

    // Notify both parties
    const candidate = await Candidate.findOne({
      $or: [
        { candidateId: contract.candidateId },
        { uniqueCode: contract.candidateId },
        { phone: contract.candidateId },
        { email: contract.candidateId },
      ],
    });

    if (signatureType === 'employer' && candidate) {
      // Notify candidate that employer signed
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        userId: candidate._id.toString(),
        userType: 'candidate',
        title: 'Employer Signed Contract',
        message: 'Employer has signed your employment contract. Please review and sign.',
        notificationType: 'contract',
        category: 'contract_signed',
        entityType: 'contract',
        entityId: contractId,
        actionUrl: `/candidate/contracts/${contractId}`,
      });
    } else if (signatureType === 'candidate') {
      // Notify employer that candidate signed
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        userId: contract.employerId,
        userType: 'employer',
        title: 'Candidate Signed Contract',
        message: 'Candidate has signed the employment contract.',
        notificationType: 'contract',
        category: 'contract_signed',
        entityType: 'contract',
        entityId: contractId,
        actionUrl: `/employer/contracts/${contractId}`,
      });
    }

    // If both parties have signed, finalize contract and release documents
    if (contract.employerSigned && contract.candidateSigned) {
      contract.contractStatus = 'signed';
      await contract.save();

      if (candidate) {
        candidate.contactReleased = true;
        candidate.status = 'in_process';
        await candidate.save();

        // Notify candidate that documents have been released
        await Notification.create({
          notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: candidate._id.toString(),
          userType: 'candidate',
          title: 'Documents Released',
          message: 'Your documents have been unlocked for the employer after contract signing.',
          notificationType: 'document',
          category: 'documents_released',
          entityType: 'contract',
          entityId: contractId,
          actionUrl: `/candidate/contracts/${contractId}`,
        });

        // Notify employer that contract is fully signed
        await Notification.create({
          notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: contract.employerId,
          userType: 'employer',
          title: 'Contract Fully Signed',
          message: 'Both parties have signed the contract. Candidate documents are now available for download.',
          notificationType: 'contract',
          category: 'contract_finalized',
          entityType: 'contract',
          entityId: contractId,
          actionUrl: `/employer/contracts/${contractId}`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Signature uploaded successfully',
      contract: contract.toObject(),
    });
  } catch (err) {
    console.error('Contract signature upload error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch contract
router.get('/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res
        .status(404)
        .json({ success: false, error: 'Contract not found' });
    }

    return res.status(200).json({
      success: true,
      contract: contract.toObject(),
    });
  } catch (err) {
    console.error('Fetch contract error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Manager/admin signature endpoint (requires manager/admin role)
const requireRole = require('../middleware/requireRole');
router.post('/:contractId/manager-sign', requireRole('admin'), signatureUpload.single('signatureFile'), async (req, res) => {
  try {
    const { contractId } = req.params;
    if (!req.file) return res.status(400).json({ success: false, error: 'signatureFile required' });

    const contract = await Contract.findOne({ contractId });
    if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });

    const signaturePath = `/uploads/signatures/${req.file.filename}`;
    contract.managerSignatureUrl = signaturePath;
    contract.managerSigned = true;
    contract.managerSignedAt = new Date();
    contract.contractStatus = 'signed';
    contract.adminVerified = true;
    contract.verifiedAt = new Date();
    await contract.save();

    // Notify both parties
    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: contract.employerId,
      userType: 'employer',
      title: 'Contract Manager Signed',
      message: 'A manager has reviewed and signed the contract. Contract is now verified.',
      notificationType: 'contract',
      category: 'contract_verified',
      entityType: 'contract',
      entityId: contractId,
      actionUrl: `/employer/contracts/${contractId}`,
    });

    const candidateDoc = await Candidate.findOne({ $or: [{ candidateId: contract.candidateId }, { uniqueCode: contract.candidateId }] });
    if (candidateDoc) {
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: candidateDoc._id.toString(),
        userType: 'candidate',
        title: 'Contract Verified',
        message: 'Your contract has been verified by management.',
        notificationType: 'contract',
        category: 'contract_verified',
        entityType: 'contract',
        entityId: contractId,
        actionUrl: `/candidate/contracts/${contractId}`,
      });
    }

    return res.json({ success: true, message: 'Contract manager-signed and verified', contract: contract.toObject() });
  } catch (err) {
    console.error('Manager sign error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
