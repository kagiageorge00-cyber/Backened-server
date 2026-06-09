const express = require('express');
const router = express.Router();
const Shortlist = require('../models/Shortlist');

router.post('/add', async (req, res) => {
  try {
    const { employerId, candidateId } = req.body;
    if (!employerId || !candidateId) return res.status(400).json({ success: false, error: 'employerId and candidateId required' });

    const shortlistId = `SL-${Date.now()}`;
    const record = await Shortlist.create({ shortlistId, employerId, candidateId });
    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    console.error('Shortlist error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employer/:employerId', async (req, res) => {
  try {
    const { employerId } = req.params;
    const items = await Shortlist.find({ employerId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('Shortlist fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
