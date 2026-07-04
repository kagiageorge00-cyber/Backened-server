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

module.exports = router;
