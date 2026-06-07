const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  readStatus: { type: String, enum: ['unread', 'read'], default: 'unread' },
}, { timestamps: true });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
// services/message.js

const User = require("../models/User");

// ==============================
// 🔔 GENERIC SENDER (CORE)
// ==============================
const sendNotification = async (user, message) => {
  try {
    if (!user) {
      console.log("⚠️ No user provided for notification");
      return;
    }

    // 👉 You can replace this with real integrations
    // Example: WhatsApp API / SMS / Email

    console.log("📩 NOTIFICATION SENT");
    console.log("To:", user.phone || user.email);
    console.log("Message:", message);

    return true;
  } catch (err) {
    console.error("❌ Notification error:", err.message);
    return false;
  }
};

// ==============================
// ✅ PAYMENT SUCCESS
// ==============================
const notifyPaymentSuccess = async (user) => {
  const message = `✅ Payment received successfully.

Your payment has been verified.

You can now proceed to the next step.

— Bliss Connect`;

  return await sendNotification(user, message);
};

// ==============================
// ✅ REGISTRATION SUCCESS
// ==============================
const notifyRegistrationSuccess = async (user) => {
  const message = `🎉 Welcome ${user.name || ""}!

Your registration is successful.

You can now log in and continue your application.

— Bliss Connect`;

  return await sendNotification(user, message);
};

// ==============================
// ✅ APPLICATION STATUS UPDATE
// ==============================
const notifyApplicationUpdate = async (user) => {
  const message = `📢 Your application status has been updated.

Please log in to your dashboard to check details.

— Bliss Connect`;

  return await sendNotification(user, message);
};

// ==============================
// 📢 BULK MESSAGING (ADMIN)
// ==============================
const sendBulkMessages = async (userType, message) => {
  try {
    const users = await User.find({ userType });

    console.log(`📢 Sending bulk messages to ${users.length} users`);

    for (const user of users) {
      await sendNotification(user, message);
    }

    return true;
  } catch (err) {
    console.error("❌ Bulk message error:", err.message);
    throw err;
  }
};

// ==============================
// EXPORTS
// ==============================
module.exports = {
  sendNotification,
  notifyPaymentSuccess,
  notifyRegistrationSuccess,
  notifyApplicationUpdate,
  sendBulkMessages,
};