const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');
const PushToken = require('../models/PushToken');

router.post('/create', async (req, res) => {
  try {
    const {
      userId,
      userType,
      title,
      message,
      notificationType,
      actionUrl,
      category,
      entityType,
      entityId,
      candidateName,
      employerName,
      amount,
      currency,
      phoneNumber,
      email,
      html,
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, error: 'userId, title and message required' });
    }

    const note = await createNotification({
      userId,
      userType,
      title,
      message,
      type: notificationType,
      actionUrl,
      category,
      entityType,
      entityId,
      candidateName,
      employerName,
      amount,
      currency,
      phoneNumber,
      email,
      html,
    });

    return res.status(201).json({ success: true, data: note });
  } catch (err) {
    console.error('Notification create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = await Notification.find({ userId }).sort({ createdAt: -1 });
    return res.json({ success: true, count: notes.length, data: notes });
  } catch (err) {
    console.error('Notification fetch error:', err);
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

// Register push token (device)
router.post('/register-token', async (req, res) => {
  try {
    const { userId, userType, token, platform } = req.body;
    if (!userId || !token) return res.status(400).json({ success: false, error: 'userId and token are required' });
    await PushToken.findOneAndUpdate({ userId, token }, { $set: { userType, platform, token, userId } }, { upsert: true });
    return res.json({ success: true, message: 'Token registered' });
  } catch (err) {
    console.error('Register token error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Send push (stub) to a userId
router.post('/send-push', async (req, res) => {
  try {
    const { userId, title, message } = req.body;
    if (!userId || !message) return res.status(400).json({ success: false, error: 'userId and message required' });
    const tokens = await PushToken.find({ userId });
    // TODO: integrate with FCM/APNs production provider
    console.log('Would send push to tokens:', tokens.map(t => t.token));
    return res.json({ success: true, sent: tokens.length });
  } catch (err) {
    console.error('Send push error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const note = await Notification.findOneAndUpdate(
      { notificationId },
      { isRead: true },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    return res.json({ success: true, data: note });
  } catch (err) {
    console.error('Notification mark read error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
