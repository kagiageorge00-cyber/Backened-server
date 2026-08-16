const express = require('express');
const router = express.Router();
const Candidate = require('../models/candidate');
const mongoose = require('mongoose');
const authenticateStaff = require('../middleware/staffAuth');
const staffController = require('../controllers/staffController');

function sanitizeValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function candidateIdentifierQuery(id) {
  const identifiers = [
    { candidateId: id },
    { uniqueCode: id },
    { phone: id },
    { email: id },
  ];
  if (mongoose.Types.ObjectId.isValid(id)) {
    identifiers.unshift({ _id: id });
  }
  return { $or: identifiers };
}

router.post('/login', staffController.login);
router.get('/accounts', staffController.listStaffAccounts);
router.get('/dashboard', staffController.dashboard);
router.get('/chats', staffController.listChats);
router.get('/chats/:id', staffController.getChatById);
router.post('/chats/app-inbound', staffController.receiveBlissAppMessage);
router.post('/chats/send', staffController.sendMessage);
router.post('/chats/upload', staffController.uploadFile);
router.put('/chats/assign', staffController.assignConversation);
router.put('/chats/transfer', staffController.transferConversation);
router.post('/chats/internal-note', staffController.addInternalNote);
router.post('/broadcast', staffController.broadcast);
router.post('/campaigns/send', staffController.broadcast);
router.get('/notifications', staffController.fetchNotifications);
router.get('/performance', staffController.performance);
router.get('/staff/performance', staffController.performance);

router.get('/applications', staffController.listApplications);
router.put('/applications/:id', staffController.updateApplication);
router.get('/candidates/pending', staffController.listPendingCandidates);
router.put('/candidates/:id/complete', staffController.completeCandidate);
router.get('/employers', staffController.listEmployers);
router.post('/employers/register', staffController.registerEmployer);
router.get('/agents', staffController.listAgents);
router.post('/agents/register', staffController.registerAgent);
router.get('/bookings', staffController.listBookings);
router.put('/bookings/:id/status', staffController.updateBookingStatus);
router.get('/support/tickets', staffController.listSupportTickets);
router.post('/support/tickets/:id/respond', staffController.respondSupportTicket);
router.get('/assignments', staffController.listAssignments);
router.post('/marketplace/jobs', staffController.postMarketplaceJob);
router.get('/marketplace/jobs', staffController.listJobs);

function escapeRegExp(value) {
  return value.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/marketplace/search', authenticateStaff, async (req, res) => {
  try {
    const { query, candidateCode, skills, country, status } = req.query;

    const filter = {};

    if (candidateCode) {
      const codeValue = escapeRegExp(candidateCode.toString().trim());
      filter.$or = [
        { uniqueCode: { $regex: `^${codeValue}$`, $options: 'i' } },
        { candidateId: { $regex: `^${codeValue}$`, $options: 'i' } },
      ];
    } else if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { candidateId: { $regex: query, $options: 'i' } },
        { uniqueCode: { $regex: query, $options: 'i' } },
      ];
    }

    if (skills) {
      filter.skills = { $regex: skills, $options: 'i' };
    }

    if (country) {
      filter.country = { $regex: country, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    }

    const candidates = await Candidate.find(filter).limit(50).sort({ createdAt: -1 });

    return res.json({ success: true, data: candidates, total: candidates.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/marketplace/candidates/:id', authenticateStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findOne(candidateIdentifierQuery(id)).select('-password');

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.json({ success: true, data: candidate });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/marketplace/candidates/:id', authenticateStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const restrictedFields = [
      '_id',
      '__v',
      'password',
      'resetToken',
      'resetTokenExpires',
      'paymentReference',
      'paymentMethod',
      'paymentDate',
      'transactionId',
      'amount',
      'paymentId',
      'createdAt',
      'applicationDate',
    ];

    Object.keys(req.body || {}).forEach((field) => {
      if (restrictedFields.includes(field)) {
        return;
      }
      if (req.body[field] !== undefined) {
        updates[field] = sanitizeValue(req.body[field]);
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'At least one marketplace field must be provided' });
    }

    const validStatuses = ['available', 'in_process', 'deployed', 'approved', 'rejected'];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const candidate = await Candidate.findOneAndUpdate(
      candidateIdentifierQuery(id),
      { $set: updates },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.json({ success: true, message: 'Marketplace candidate updated', data: candidate });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
