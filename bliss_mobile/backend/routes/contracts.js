const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');

router.post('/create', async (req, res) => {
  try {
    const { deploymentId, contractFile } = req.body;
    if (!deploymentId) return res.status(400).json({ success: false, error: 'deploymentId required' });
    const contractId = `CON-${Date.now()}`;
    const doc = await Contract.create({ contractId, deploymentId, contractFile });
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('Contract create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
