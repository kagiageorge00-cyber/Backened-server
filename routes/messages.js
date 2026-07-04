const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Deployment = require('../models/Deployment');
const Candidate = require('../models/Candidate');
const Employer = require('../models/Employer');
const Notification = require('../models/Notification');
const { employerAuth } = require('../middleware/auth');

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
async function canMessage(employerId, candidateId) {
  try {
    const deployment = await Deployment.findOne({
      employerId,
      candidateId,
      currentStage: { $in: ['Contract', 'Visa', 'Active', 'Deployed'] },
      adminVerified: true,
    });
    return deployment != null;
  } catch (err) {
    return false;
  }
}

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
    const hasDeployment = await canMessage(senderId, receiverId);
    if (!hasDeployment) {
      return res.status(403).json({
        success: false,
        error: 'Cannot message this candidate. Deploy them first.',
        requiresDeployment: true,
      });
    }

    // Create message
    const msg = await Message.create({
      conversationId,
      senderId,
      receiverId,
      message,
      senderType: 'employer',
    });

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

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark as read for employer
    await Message.updateMany(
      {
        conversationId,
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

    // Get unique candidate IDs from conversations
    const messages = await Message.find({
      $or: [{ senderId: employerId }, { receiverId: employerId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Group by conversation
    const conversationMap = new Map();
    for (const msg of messages) {
      const conversationId = msg.conversationId;
      if (!conversationMap.has(conversationId)) {
        const otherParty =
          msg.senderId === employerId ? msg.receiverId : msg.senderId;
        conversationMap.set(conversationId, {
          conversationId,
          candidateId: otherParty,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
        });
      }
    }

    const conversations = Array.from(conversationMap.values());

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
