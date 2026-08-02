const jwt = require('jsonwebtoken');
const Agent = require('../../models/Agent');
const Notification = require('../../models/Notification');
const AgentReferral = require('../../models/AgentReferral');
const AgentCommission = require('../../models/AgentCommission');
const AgentWithdrawal = require('../../models/AgentWithdrawal');
const PushToken = require('../../models/PushToken');
const mongoose = require('mongoose');

function createToken(agent) {
  return jwt.sign(
    {
      sub: agent._id.toString(),
      role: agent.role || 'agent',
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
    state: agent.state || '',
    city: agent.city || '',
    address: agent.address || '',
    nationalId: agent.nationalId || '',
    profilePhoto: agent.profilePhoto || '',
    paymentMethod: agent.paymentMethod || 'bank_transfer',
    agentType: agent.agentType,
    agentCode: agent.agentCode,
    referralCode: agent.referralCode,
    status: agent.status,
    wallet: agent.wallet,
    createdAt: agent.createdAt,
    lastLoginAt: agent.lastLoginAt,
    temporaryPassword: agent.temporaryPassword,
  };
}

async function getAuthenticatedAgent(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    const error = new Error('Missing token');
    error.statusCode = 401;
    throw error;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  const agent = await Agent.findById(decoded.sub);
  if (!agent) {
    const error = new Error('Agent not found');
    error.statusCode = 404;
    throw error;
  }

  return { agent, decoded };
}

async function register(req, res) {
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

    const count = await Agent.countDocuments();
    const agentCode = `AGT-2026-${String(count + 1).padStart(6, '0')}`;
    const referralCode = `REF-${String(count + 1).padStart(6, '0')}`;

    const agent = await Agent.create({
      fullName,
      email,
      phone,
      country,
      password,
      agentType,
      agentCode,
      referralCode,
      status: 'active',
    });

    const token = createToken(agent);
    return res.status(201).json({ success: true, message: 'Agent registered successfully.', token, agent: buildAgentPayload(agent) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Agent registration failed.', error: error.message });
  }
}

async function login(req, res) {
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
}

async function getProfile(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    return res.json({ success: true, agent: buildAgentPayload(agent) });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const allowedFields = ['fullName', 'phone', 'country', 'state', 'city', 'address', 'nationalId', 'profilePhoto', 'paymentMethod', 'bankDetails', 'mobileMoney'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        agent[field] = req.body[field];
      }
    });

    await agent.save();
    return res.json({ success: true, message: 'Profile updated successfully.', agent: buildAgentPayload(agent) });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function getDashboard(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const referralCount = await AgentReferral.countDocuments({ agentId: agent._id.toString() });
    const commissionCount = await AgentCommission.countDocuments({ agentId: agent._id.toString() });
    const withdrawalCount = await AgentWithdrawal.countDocuments({ agentId: agent._id.toString() });
    const notificationsCount = await Notification.countDocuments({ userId: agent._id.toString(), userType: 'agent', isRead: false });
    const referrals = await AgentReferral.find({ agentId: agent._id.toString() }).sort({ createdAt: -1 }).limit(20);
    const commissions = await AgentCommission.find({ agentId: agent._id.toString() }).sort({ createdAt: -1 }).limit(20);
    const notificationsList = await Notification.find({ userId: agent._id.toString(), userType: 'agent' }).sort({ createdAt: -1 }).limit(20);

    const dashboard = {
      totalReferrals: referralCount,
      successfulDeployments: agent.wallet.completedWithdrawals || 0,
      pendingDeployments: agent.wallet.pendingWithdrawals || 0,
      commissionWallet: agent.wallet.availableBalance,
      pendingCommission: agent.wallet.pendingBalance,
      paidCommission: agent.wallet.withdrawnAmount,
      withdrawableBalance: agent.wallet.availableBalance,
      notifications: notificationsCount,
      leaderboardPosition: 0,
      agentType: agent.agentType,
      referrals: referrals.map((item) => ({
        id: item._id.toString(),
        name: item.referredName,
        type: item.referralType,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
      commissions: commissions.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        amount: item.amount,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
      notificationsList: notificationsList.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        message: item.message,
        createdAt: item.createdAt.toISOString(),
      })),
      leaderboard: [],
      withdrawals: await AgentWithdrawal.find({ agentId: agent._id.toString() }).sort({ createdAt: -1 }).limit(10),
    };

    return res.json({ success: true, dashboard });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function registerLead(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const {
      leadType,
      name,
      email,
      phone,
      country,
      notes,
      referralCode,
      referredByAgentId,
      referredByAgentName,
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'name, email and phone are required.' });
    }

    const referral = await AgentReferral.create({
      agentId: agent._id.toString(),
      referredName: name,
      referredEmail: email,
      referredPhone: phone,
      referralType: ['candidate', 'employer'].includes(leadType) ? leadType : 'candidate',
      status: 'pending',
      notes: notes || '',
      metadata: {
        country: country || '',
        referralCode: referralCode || agent.referralCode,
        referredByAgentId: referredByAgentId || agent._id.toString(),
        referredByAgentName: referredByAgentName || agent.fullName,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Lead registered and linked to agent.',
      referral: {
        id: referral._id.toString(),
        name: referral.referredName,
        type: referral.referralType,
        status: referral.status,
        createdAt: referral.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function listReferrals(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const referrals = await AgentReferral.find({ agentId: agent._id.toString() }).sort({ createdAt: -1 });
    const payload = referrals.map((item) => ({
      id: item._id.toString(),
      name: item.referredName,
      type: item.referralType,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      referralCode: item.metadata?.referralCode || '',
      referredByAgentName: item.metadata?.referredByAgentName || '',
      referredByAgentId: item.metadata?.referredByAgentId || '',
      email: item.referredEmail || '',
      phone: item.referredPhone || '',
    }));
    return res.json({ success: true, referrals: payload });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function listCommissions(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const commissions = await AgentCommission.find({ agentId: agent._id.toString() }).sort({ createdAt: -1 });
    return res.json({ success: true, commissions });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function requestWithdrawal(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const { amount, paymentMethod, destination } = req.body;
    const requestedAmount = Number(amount);
    if (!requestedAmount || requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }

    if (requestedAmount > agent.wallet.availableBalance) {
      return res.status(400).json({ success: false, message: 'Insufficient available balance.' });
    }

    const withdrawal = await AgentWithdrawal.create({
      agentId: agent._id.toString(),
      amount: requestedAmount,
      paymentMethod: paymentMethod || agent.paymentMethod || 'bank_transfer',
      destination: destination || '',
      status: 'pending',
    });

    agent.wallet.availableBalance = Math.max(0, agent.wallet.availableBalance - requestedAmount);
    agent.wallet.pendingWithdrawals = (agent.wallet.pendingWithdrawals || 0) + requestedAmount;
    await agent.save();

    return res.status(201).json({ success: true, withdrawal, message: 'Withdrawal request created successfully.' });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function listWithdrawals(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const withdrawals = await AgentWithdrawal.find({ agentId: agent._id.toString() }).sort({ createdAt: -1 });
    return res.json({ success: true, withdrawals });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function registerPushToken(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const { token, platform } = req.body;
    if (!token || !platform) {
      return res.status(400).json({ success: false, message: 'token and platform are required.' });
    }
    const existing = await PushToken.findOne({ userId: agent._id.toString(), token });
    if (existing) {
      return res.json({ success: true, message: 'Push token already registered.' });
    }
    const pushToken = await PushToken.create({
      userId: agent._id.toString(),
      userType: 'agent',
      token,
      platform,
    });
    return res.status(201).json({ success: true, pushToken });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function listPushTokens(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const tokens = await PushToken.find({ userId: agent._id.toString(), userType: 'agent' });
    return res.json({ success: true, tokens });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function createNotification(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'title and message are required.' });
    }

    const notification = await Notification.create({
      userId: agent._id.toString(),
      userType: 'agent',
      title,
      message,
      isRead: false,
    });

    return res.status(201).json({ success: true, notification });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

async function listNotifications(req, res) {
  try {
    const { agent } = await getAuthenticatedAgent(req);
    const notifications = await Notification.find({ userId: agent._id.toString(), userType: 'agent' }).sort({ createdAt: -1 });
    return res.json({ success: true, notifications });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ success: false, message: error.message });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getDashboard,
  createNotification,
  listNotifications,
  registerLead,
  listReferrals,
  listCommissions,
  requestWithdrawal,
  listWithdrawals,
  registerPushToken,
  listPushTokens,
  createToken,
  buildAgentPayload,
};
