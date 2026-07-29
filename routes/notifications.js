const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');

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
