const express = require('express');
const Candidate = require('../models/candidate');
const router = express.Router();

// GET /api/marketplace/candidates
router.get('/candidates', async (req, res) => {
  try {
    const { country, skills, experience, verified, page = 1, limit = 20 } = req.query;
    const query = {};
    if (country) query.country = country;
    if (verified !== undefined) query.isVerified = verified === 'true';
    if (experience) query.experience = { $regex: experience, $options: 'i' };
    if (skills) query.skills = { $in: skills.split(',').map((s) => s.trim()) };

    const skip = (Number(page) - 1) * Number(limit);
    const candidates = await Candidate.find(query).skip(skip).limit(Number(limit)).select('-password');

    return res.json({ success: true, data: candidates });
  } catch (err) {
    console.error('Marketplace error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
