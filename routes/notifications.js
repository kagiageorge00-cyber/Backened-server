const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

router.post('/create', async (req, res) => {
  try {
    const { userId, userType, title, message, notificationType, actionUrl } = req.body;
    if (!userId || !title || !message) return res.status(400).json({ success: false, error: 'userId, title and message required' });

    const notificationId = `NOT-${Date.now()}`;
    const note = await Notification.create({ notificationId, userId, userType, title, message, notificationType, actionUrl });
    return res.status(201).json({ success: true, data: note });
  } catch (err) {
    console.error('Notification create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/user/:userType/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = await Notification.find({ userId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: notes });
  } catch (err) {
    console.error('Notification fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
