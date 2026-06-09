const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

router.post('/conversations', async (req, res) => {
  try {
    const { participants } = req.body;
    if (!participants || !Array.isArray(participants) || participants.length < 2) return res.status(400).json({ success: false, error: 'participants array required' });

    const conversationId = `CONV-${Date.now()}`;
    const conv = await Conversation.create({ conversationId, participants });
    return res.status(201).json({ success: true, data: conv });
  } catch (err) {
    console.error('Conversation create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const { conversationId, senderId, receiverId, message } = req.body;
    if (!conversationId || !senderId || !receiverId || !message) return res.status(400).json({ success: false, error: 'conversationId, senderId, receiverId and message required' });

    const msg = await Message.create({ conversationId, senderId, receiverId, message });
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error('Message send error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/conversations/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const convs = await Conversation.find({ participants: participantId }).sort({ updatedAt: -1 });
    return res.json({ success: true, data: convs });
  } catch (err) {
    console.error('Conversations fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return res.json({ success: true, data: messages });
  } catch (err) {
    console.error('Messages fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
