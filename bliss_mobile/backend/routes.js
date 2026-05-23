const express = require('express');
const router = express.Router();
const User = require('./models/User');
const Message = require('./models/Message');

// Incoming WhatsApp message webhook
router.post('/incoming-message', async (req, res) => {
  const { phone, message } = req.body;
  const user = await User.findOne({ phone });
  const userType = user ? user.userType : 'general';
  await Message.create({
    phone,
    message,
    userType,
    createdAt: new Date(),
  });
  res.sendStatus(200);
});

module.exports = router;
