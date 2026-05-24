const User = require('./models/User');
const { sendWhatsAppMessage } = require('./whatsapp');

async function sendBulkMessages(userType, message) {
  const users = await User.find(userType === 'all' ? {} : { userType });
  const batchSize = 50;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    for (let user of batch) {
      await sendWhatsAppMessage(user.phone, message);
    }
    if (i + batchSize < users.length) {
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 min delay
    }
  }
}

module.exports = { sendBulkMessages };
