const express = require('express');
const {
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
} = require('../controllers/agents/agentController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard', getDashboard);
router.post('/referrals', registerLead);
router.get('/referrals', listReferrals);
router.get('/commissions', listCommissions);
router.post('/withdrawals', requestWithdrawal);
router.get('/withdrawals', listWithdrawals);
router.post('/notifications', createNotification);
router.get('/notifications', listNotifications);
router.post('/push-token', registerPushToken);
router.get('/push-tokens', listPushTokens);

module.exports = router;
