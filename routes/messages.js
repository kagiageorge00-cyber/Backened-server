const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Deployment = require('../models/Deployment');
const Candidate = require('../models/candidate');
const Employer = require('../models/Employer');
const Notification = require('../models/Notification');
const employerAuth = require('../middleware/employerAuth');

// Blocked patterns for security
const BLOCKED_PATTERNS = [
  /\b\d{10,}\b/, // Phone numbers
  /[\+]?[0-9]{1,3}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/, // International phone
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Emails
  /(?:wa\.me|whatsapp|whatsapp\.com)/i, // WhatsApp
  /(?:facebook|messenger|instagram|telegram|signal)/i, // Social media
  /(?:\.jpg|\.jpeg|\.png|\.gif|\.pdf|\.doc|\.docx)/i, // File extensions
  /(?:telegram|viber|line|skype)/i, // Messaging apps
];

// Validate message for security
function validateMessageContent(message) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(message)) {
      return false;
    }
  }
  return true;
}

// Check if employer has active deployment with candidate
async function canMessage(employerId, candidateIds) {
  try {
    const identifiers = Array.isArray(candidateIds) ? candidateIds : [candidateIds];
    const deployment = await Deployment.findOne({
      employerId,
      candidateId: { $in: identifiers.filter(Boolean) },
      currentStage: { $in: ['Contract', 'Visa', 'Active', 'Deployed'] },
      adminVerified: true,
    });
    return deployment != null;
  } catch (err) {
    return false;
  }
}

// Open a candidate conversation after an admin-approved deployment.
router.post('/conversations', employerAuth, async (req, res) => {
  try {
    const candidateLookup = String(req.body?.candidateId || '').trim();
    if (!candidateLookup) {
      return res.status(400).json({ success: false, error: 'candidateId is required' });
    }

    const candidateFilters = [
      { uniqueCode: candidateLookup },
      { candidateId: candidateLookup },
    ];
    if (mongoose.Types.ObjectId.isValid(candidateLookup)) {
      candidateFilters.unshift({ _id: candidateLookup });
    }
    const candidate = await Candidate.findOne({ $or: candidateFilters }).select('_id uniqueCode candidateId fullName name');
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const candidateIds = [candidate._id.toString(), candidate.uniqueCode, candidate.candidateId].filter(Boolean);
    if (!await canMessage(req.employer.employerId, candidateIds)) {
      return res.status(403).json({
        success: false,
        error: 'Chat becomes available after the candidate has an admin-approved active deployment.',
        requiresDeployment: true,
      });
    }

    const participants = [req.employer.employerId, candidate._id.toString()];
    let conversation = await Conversation.findOne({
      participants: { $all: participants },
      $expr: { $eq: [{ $size: '$participants' }, participants.length] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        conversationId: `CONV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        participants,
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
      candidate: {
        id: candidate._id.toString(),
        candidateCode: candidate.uniqueCode || candidate.candidateId || '',
        name: candidate.fullName || candidate.name || 'Candidate',
      },
    });
  } catch (err) {
    console.error('Employer conversation start error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Unable to start chat' });
  }
});

// Send message (employer to candidate)
router.post('/send', employerAuth, async (req, res) => {
  try {
    const { conversationId, senderId, receiverId, message } = req.body;

    // Validate inputs
    if (!conversationId || !senderId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        error: 'conversationId, senderId, receiverId and message required',
      });
    }

    // Validate message content
    if (!validateMessageContent(message)) {
      return res.status(403).json({
        success: false,
        error:
          'Message contains restricted content (contact details, documents, etc.). Use Bliss Chat only.',
        violationType: 'BLOCKED_CONTENT',
      });
    }

    // Check if employer is authorized
    if (senderId !== req.employer.employerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized sender',
      });
    }

    // Check if employer has active deployment with this candidate
    const candidate = await Candidate.findOne({
      $or: [
        { uniqueCode: receiverId },
        { candidateId: receiverId },
        ...(mongoose.Types.ObjectId.isValid(receiverId) ? [{ _id: receiverId }] : []),
      ],
    }).select('_id uniqueCode candidateId');
    const candidateIds = candidate
      ? [candidate._id.toString(), candidate.uniqueCode, candidate.candidateId, receiverId].filter(Boolean)
      : [receiverId];
    const conversation = await Conversation.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(conversationId) ? [{ _id: conversationId }] : []),
        { conversationId },
      ],
      participants: { $all: [senderId, candidate?._id.toString() || receiverId] },
    });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const hasDeployment = await canMessage(senderId, candidateIds);
    if (!hasDeployment) {
      return res.status(403).json({
        success: false,
        error: 'Cannot message this candidate. Deploy them first.',
        requiresDeployment: true,
      });
    }

    // Create message
    const msg = await Message.create({
      conversationId: conversation._id.toString(),
      senderId,
      receiverId,
      message,
      senderType: 'employer',
    });
    conversation.updatedAt = new Date();
    await conversation.save();

    // Create notification for candidate
    const notificationId = `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    await Notification.create({
      notificationId,
      userId: receiverId,
      userType: 'candidate',
      entityType: 'message',
      entityId: msg._id.toString(),
      title: 'New Message from Employer',
      message: `You have a new message in Bliss Chat`,
      actionUrl: `/candidate/messages/${conversationId}`,
      status: 'unread',
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: msg,
      message: 'Message sent successfully',
    });
  } catch (err) {
    console.error('Message send error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send message',
    });
  }
});

// Get conversation messages (employer)
router.get('/:conversationId', employerAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(conversationId) ? [{ _id: conversationId }] : []),
        { conversationId },
      ],
      participants: req.employer.employerId,
    });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const canonicalConversationId = conversation._id.toString();
    const messages = await Message.find({ conversationId: canonicalConversationId })
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark as read for employer
    await Message.updateMany(
      {
        conversationId: canonicalConversationId,
        receiverId: req.employer.employerId,
        readStatus: 'unread',
      },
      { readStatus: 'read' }
    );

    return res.json({
      success: true,
      data: messages,
    });
  } catch (err) {
    console.error('Messages fetch error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Get all conversations for employer
router.get('/employer/conversations', employerAuth, async (req, res) => {
  try {
    const employerId = req.employer.employerId;

    const storedConversations = await Conversation.find({ participants: employerId })
      .sort({ updatedAt: -1 })
      .lean();
    const conversations = await Promise.all(storedConversations.map(async (conversation) => {
      const candidateId = conversation.participants.find((participant) => participant !== employerId) || '';
      const candidateFilters = [
        { uniqueCode: candidateId },
        { candidateId },
      ];
      if (mongoose.Types.ObjectId.isValid(candidateId)) {
        candidateFilters.unshift({ _id: candidateId });
      }
      const [candidate, lastMessage] = await Promise.all([
        Candidate.findOne({ $or: candidateFilters })
          .select('_id uniqueCode candidateId fullName name')
          .lean(),
        Message.findOne({ conversationId: conversation._id.toString() })
          .sort({ createdAt: -1 })
          .lean(),
      ]);
      return {
        conversationId: conversation._id.toString(),
        candidateId: candidate?._id?.toString() || candidateId,
        candidateCode: candidate?.uniqueCode || candidate?.candidateId || candidateId,
        candidateName: candidate?.fullName || candidate?.name || candidateId,
        lastMessage: lastMessage?.message || '',
        lastMessageTime: lastMessage?.createdAt || conversation.updatedAt,
      };
    }));

    return res.json({
      success: true,
      data: conversations,
    });
  } catch (err) {
    console.error('Conversations fetch error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Report messaging violation
router.post('/:conversationId/report', employerAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { reason, messageId } = req.body;

    const report = {
      reportId: `RPT-${Date.now()}`,
      conversationId,
      reportedBy: req.employer.employerId,
      messageId,
      reason,
      status: 'pending_review',
      createdAt: new Date(),
    };

    // In production, store in ReportedMessage collection
    // For now, log it
    console.log('[MESSAGING VIOLATION REPORT]', report);

    return res.json({
      success: true,
      message: 'Report submitted. Our team will review it.',
    });
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
