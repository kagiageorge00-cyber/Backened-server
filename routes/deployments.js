const express = require('express');
const router = express.Router();
const Deployment = require('../models/Deployment');
const PaymentRecord = require('../models/PaymentRecord');

router.post('/create', async (req, res) => {
  try {
    const { employerId, candidateId } = req.body;
    if (!employerId || !candidateId) return res.status(400).json({ success: false, error: 'employerId and candidateId required' });

    const deploymentId = `DEP-${Date.now()}`;
    const dep = await Deployment.create({ deploymentId, employerId, candidateId });
    return res.status(201).json({ success: true, data: dep });
  } catch (err) {
    console.error('Deployment create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employer/:employerId', async (req, res) => {
  try {
    const { employerId } = req.params;
    const list = await Deployment.find({ employerId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('Deployment list error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:deploymentId/status', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const updates = req.body;
    const dep = await Deployment.findOneAndUpdate({ deploymentId }, updates, { new: true });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });
    return res.json({ success: true, data: dep });
  } catch (err) {
    console.error('Deployment update error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Simulate deployment payment and create payment record + contract
router.post('/:deploymentId/pay', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { employerId, amount, paymentMethod } = req.body;
    if (!deploymentId || !employerId || !amount) return res.status(400).json({ success: false, error: 'deploymentId, employerId and amount required' });

    const dep = await Deployment.findOne({ deploymentId });
    if (!dep) return res.status(404).json({ success: false, error: 'Deployment not found' });

    const PaymentRecord = require('../models/PaymentRecord');
    const Contract = require('../models/Contract');

    const paymentId = `PAY-${Date.now()}`;
    const pr = await PaymentRecord.create({ paymentId, deploymentId, employerId, amount, paymentMethod, paymentStatus: 'completed', paidAt: new Date() });

    // mark deployment as paid
    dep.paid = true;
    dep.paymentStatus = 'completed';
    await dep.save();

    // create contract placeholder
    const contract = await Contract.create({ contractId: `CTR-${Date.now()}`, deploymentId, contractFile: 'generated-contract.pdf' });

    return res.json({ success: true, payment: pr, contract });
  } catch (err) {
    console.error('Deployment pay error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
