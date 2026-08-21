const express = require('express');
const router = express.Router();
const Deployment = require('../models/Deployment');
const PaymentRecord = require('../models/PaymentRecord');
const Candidate = require('../models/candidate');
const employerAuth = require('../middleware/employerAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { buildDeploymentSummary, calculateDeploymentFees } = require('../services/localRecruitmentService');

const receiptStorage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'payment_receipts');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const visaStorage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'visas');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const visaUpload = multer({
  storage: visaStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.use(employerAuth);

router.post('/create', async (req, res) => {
  try {
    const employer = req.employer;
    if (!employer || employer.status !== 'active' || !['verified_employer', 'active_employer'].includes(employer.verificationStatus)) {
      return res.status(403).json({ success: false, error: 'Employer account is not verified or active' });
    }

    const { candidateId, candidateName, candidateCountry, jobPosition } = req.body;
    if (!candidateId) return res.status(400).json({ success: false, error: 'candidateId required' });

    const candidate = await Candidate.findOne({
      $or: [
        { candidateId },
        { uniqueCode: candidateId },
        { phone: candidateId },
        { email: candidateId },
      ],
    });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }
    const allowedStatuses = ['available', 'selected', 'interviewed'];
    if (!candidate.isVerified || !allowedStatuses.includes(candidate.status)) {
      return res.status(400).json({ success: false, error: 'Candidate is not verified or currently unavailable for deployment' });
    }

    const deploymentId = `DEP-${Date.now()}`;
    const dep = await Deployment.create({
      deploymentId,
      employerId: employer.employerId,
      candidateId: candidate.candidateId || candidate.uniqueCode || candidate._id.toString(),
      candidateName: candidateName || candidate.fullName || candidate.candidateName,
      candidateCountry,
      jobPosition,
    });
    return res.status(201).json({ success: true, data: dep });
  } catch (err) {
    console.error('Deployment create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employer/:employerId', async (req, res) => {
  try {
    const employer = req.employer;
    const { employerId } = req.params;
    if (employer.employerId !== employerId) {
      return res.status(403).json({ success: false, error: 'Employer access denied' });
    }
    const list = await Deployment.find({ employerId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('Deployment list error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:deploymentId/status', async (req, res) => {
  try {
    const employer = req.employer;
    const { deploymentId } = req.params;
    const updates = req.body;
    const dep = await Deployment.findOne({ deploymentId });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });
    if (dep.employerId !== employer.employerId) {
      return res.status(403).json({ success: false, error: 'Employer access denied' });
    }
    Object.assign(dep, updates);
    await dep.save();
    return res.json({ success: true, data: dep });
  } catch (err) {
    console.error('Deployment update error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Simulate deployment payment and create payment record + contract
router.post('/:deploymentId/pay', async (req, res) => {
  try {
    const employer = req.employer;
    const { deploymentId } = req.params;
    const { amount, paymentMethod, grossSalary, candidateName } = req.body;
    if (!deploymentId || !amount) return res.status(400).json({ success: false, error: 'deploymentId and amount required' });

    const dep = await Deployment.findOne({ deploymentId });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });
    if (dep.employerId !== employer.employerId) {
      return res.status(403).json({ success: false, error: 'Employer access denied' });
    }

    const PaymentRecord = require('../models/PaymentRecord');
    const Contract = require('../models/Contract');
    const fees = calculateDeploymentFees(grossSalary || dep.deploymentFee || amount);

    const paymentId = `PAY-${Date.now()}`;
    const pr = await PaymentRecord.create({
      paymentId,
      deploymentId,
      employerId: employer.employerId,
      amount: Number(amount || fees.totalDue),
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentStatus: 'completed',
      paidAt: new Date(),
    });

    dep.paid = true;
    dep.paymentStatus = 'verified';
    dep.currentStage = 'Payment';
    dep.deploymentFee = fees.totalDue;
    dep.paymentMethod = paymentMethod || 'bank_transfer';
    await dep.save();

    const candidate = await Candidate.findOne({
      $or: [
        { candidateId: dep.candidateId },
        { uniqueCode: dep.candidateId },
        { phone: dep.candidateId },
        { email: dep.candidateId },
      ],
    });
    if (candidate) {
      candidate.status = 'deployed';
      candidate.currentStatus = 'Deployed';
      candidate.contactReleased = true;
      await candidate.save();
    }

    const contract = await Contract.create({
      contractId: `CTR-${Date.now()}`,
      deploymentId,
      employerId: employer.employerId,
      candidateId: dep.candidateId,
      candidateName: candidateName || candidate?.fullName || dep.candidateName || 'Candidate',
      employerName: employer.companyName || employer.fullName || 'Employer',
      contractStatus: 'pending_employer_signature',
    });

    return res.json({ success: true, payment: pr, contract, deployment: dep, fees, summary: buildDeploymentSummary({ candidateName: candidateName || candidate?.fullName || dep.candidateName || 'Candidate', grossSalary: grossSalary || dep.deploymentFee || amount, paymentMethod: paymentMethod || 'bank_transfer' }) });
  } catch (err) {
    console.error('Deployment pay error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:deploymentId/fees', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { grossSalary, candidateName, paymentMethod } = req.body;
    const dep = await Deployment.findOne({ deploymentId });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });
    const summary = buildDeploymentSummary({ candidateName: candidateName || dep.candidateName || 'Candidate', grossSalary: grossSalary || dep.deploymentFee || 0, paymentMethod });
    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error('Deployment fees error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Submit payment proof for verification
router.post('/:deploymentId/payment-proof', receiptUpload.single('receiptFile'), employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const { deploymentId } = req.params;
    const { paymentMethod, referenceNumber, notes } = req.body;

    if (!deploymentId) return res.status(400).json({ success: false, error: 'deploymentId required' });
    if (!paymentMethod || !referenceNumber) return res.status(400).json({ success: false, error: 'paymentMethod and referenceNumber required' });
    if (!req.file) return res.status(400).json({ success: false, error: 'Receipt file is required' });

    const dep = await Deployment.findOne({ deploymentId });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });
    if (dep.employerId !== employer.employerId) {
      return res.status(403).json({ success: false, error: 'Employer access denied' });
    }

    const receiptPath = `/uploads/payment_receipts/${req.file.filename}`;
    dep.paymentStatus = 'submitted';
    dep.paymentMethod = paymentMethod;
    dep.referenceNumber = referenceNumber;
    dep.receiptUrl = receiptPath;
    dep.paymentNotes = notes || '';
    await dep.save();

    return res.status(201).json({
      success: true,
      message: 'Payment proof submitted for verification',
      data: dep,
    });
  } catch (err) {
    console.error('Payment proof submission error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Upload visa document
router.post('/:deploymentId/visa', visaUpload.single('visaFile'), employerAuth, async (req, res) => {
  try {
    const employer = req.employer;
    const { deploymentId } = req.params;

    if (!deploymentId) return res.status(400).json({ success: false, error: 'deploymentId required' });
    if (!req.file) return res.status(400).json({ success: false, error: 'Visa file is required' });

    const dep = await Deployment.findOne({ deploymentId });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });
    if (dep.employerId !== employer.employerId) {
      return res.status(403).json({ success: false, error: 'Employer access denied' });
    }

    const visaPath = `/uploads/visas/${req.file.filename}`;
    dep.visaStatus = 'submitted';
    dep.visaUrl = visaPath;
    dep.visaUploadedAt = new Date();
    dep.currentStage = 'Visa';
    await dep.save();

    // Create notification for employer
    const Notification = require('../models/Notification');
    await Notification.create({
      notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: employer.employerId,
      userType: 'employer',
      title: 'Visa Uploaded',
      message: `Visa for ${dep.candidateName} (${dep.candidateId}) has been uploaded successfully.`,
      notificationType: 'deployment',
      category: 'visa',
      entityType: 'deployment',
      entityId: dep.deploymentId,
      actionUrl: `/employer/documents/${dep.deploymentId}`,
    });

    // Create notification for candidate
    const candidateDoc = await Candidate.findOne({
      $or: [
        { candidateId: dep.candidateId },
        { uniqueCode: dep.candidateId },
        { phone: dep.candidateId },
        { email: dep.candidateId },
      ],
    });

    if (candidateDoc) {
      await Notification.create({
        notificationId: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: candidateDoc._id.toString(),
        userType: 'candidate',
        title: 'Your Employment Visa is Ready',
        message: `Your employment visa for deployment ${dep.deploymentId} has been uploaded. You can now download it from your documents section.`,
        notificationType: 'deployment',
        category: 'visa',
        entityType: 'deployment',
        entityId: dep.deploymentId,
        actionUrl: `/candidate/documents/${dep.deploymentId}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Visa uploaded successfully',
      data: dep,
    });
  } catch (err) {
    console.error('Visa upload error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Compatibility endpoint for clients that already have a hosted visa document URL.
router.post('/:deploymentId/visa-reference', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { visaNumber, visaPdfUrl, visaIssueDate, visaExpiryDate, remarks } = req.body;
    const dep = await Deployment.findOne({ deploymentId, employerId: req.employer.employerId });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });
    if (!visaNumber || !visaPdfUrl) return res.status(400).json({ success: false, error: 'visaNumber and visaPdfUrl are required' });
    dep.visaStatus = 'submitted';
    dep.visaUrl = visaPdfUrl;
    dep.visaUploadedAt = new Date();
    dep.currentStage = 'Visa';
    await dep.save();
    return res.status(201).json({ success: true, data: dep, visaIssueDate, visaExpiryDate, remarks });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:deploymentId/ticket', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { airline, flightNumber, departureAirport, arrivalAirport, departureDate, departureTime, ticketPdfUrl, boardingPassUrl } = req.body;
    const dep = await Deployment.findOne({ deploymentId, employerId: req.employer.employerId });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });
    if (!airline || !flightNumber || !departureAirport || !arrivalAirport || !ticketPdfUrl) {
      return res.status(400).json({ success: false, error: 'Complete ticket details are required' });
    }
    dep.ticketStatus = 'uploaded';
    dep.currentStage = 'Ticket';
    dep.arrivalStatus = 'uploaded';
    await dep.save();
    return res.status(201).json({ success: true, data: dep, ticket: { airline, flightNumber, departureAirport, arrivalAirport, departureDate, departureTime, ticketPdfUrl, boardingPassUrl } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:deploymentId/complete', async (req, res) => {
  try {
    const dep = await Deployment.findOne({ deploymentId: req.params.deploymentId, employerId: req.employer.employerId });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });
    if (dep.ticketStatus !== 'uploaded' || dep.visaStatus !== 'submitted') {
      return res.status(400).json({ success: false, error: 'Visa and ticket must be uploaded before completion' });
    }
    dep.currentStage = 'Active';
    dep.deploymentStatus = 'active';
    dep.progress = 1;
    await dep.save();
    return res.json({ success: true, data: dep });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
