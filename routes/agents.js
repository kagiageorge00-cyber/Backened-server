const express = require('express');
const jwt = require('jsonwebtoken');
const Agent = require('../models/Agent');

const router = express.Router();

function createToken(agent) {
  return jwt.sign(
    {
      sub: agent._id.toString(),
      role: 'agent',
      agentType: agent.agentType,
      agentCode: agent.agentCode,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '8h' }
  );
}

function buildAgentPayload(agent) {
  return {
    id: agent._id.toString(),
    fullName: agent.fullName,
    email: agent.email,
    phone: agent.phone,
    country: agent.country,
    agentType: agent.agentType,
    agentCode: agent.agentCode,
    referralCode: agent.referralCode,
    status: agent.status,
    wallet: agent.wallet,
    createdAt: agent.createdAt,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, country, password, agentType } = req.body;

    if (!fullName || !email || !phone || !password || !agentType) {
      return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
    }

    if (!['candidate', 'employer'].includes(agentType)) {
      return res.status(400).json({ success: false, message: 'agentType must be candidate or employer.' });
    }

    const existing = await Agent.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An agent with this email or phone already exists.' });
    }

    const count = typeof Agent.countDocuments === 'function'
      ? await Agent.countDocuments()
      : 0;
    const agentCode = `AGT-2026-${String(count + 1).padStart(6, '0')}`;
    const referralCode = `REF-${String(count + 1).padStart(6, '0')}`;
    const temporaryPassword = `BLISS-${Math.random().toString(36).slice(-4).toUpperCase()}`;

    const agent = await Agent.create({
      fullName,
      email,
      phone,
      country,
      password,
      agentType,
      agentCode,
      referralCode,
      temporaryPassword,
      status: 'active',
    });

    const token = createToken(agent);

    return res.status(201).json({
      success: true,
      message: 'Agent registered successfully.',
      token,
      agent: buildAgentPayload(agent),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Agent registration failed.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'identifier and password are required.' });
    }

    const agent = await Agent.findOne({
      $or: [{ email: identifier }, { agentCode: identifier }, { phone: identifier }],
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    const isValid = await agent.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    agent.lastLoginAt = new Date();
    await agent.save();

    const token = createToken(agent);
    return res.json({ success: true, token, agent: buildAgentPayload(agent) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Agent login failed.', error: error.message });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const agent = await Agent.findById(decoded.sub);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    return res.json({ success: true, agent: buildAgentPayload(agent) });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token.', error: error.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const agent = await Agent.findById(decoded.sub);

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    const dashboard = {
      totalReferrals: 0,
      successfulDeployments: 0,
      pendingDeployments: 0,
      commissionWallet: agent.wallet.availableBalance,
      pendingCommission: agent.wallet.pendingBalance,
      paidCommission: agent.wallet.withdrawnAmount,
      withdrawableBalance: agent.wallet.availableBalance,
      notifications: 0,
      leaderboardPosition: 0,
      agentType: agent.agentType,
    };

    return res.json({ success: true, dashboard });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token.', error: error.message });
  }
});

module.exports = router;
