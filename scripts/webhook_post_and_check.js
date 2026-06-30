(async ()=>{
  const axios = require('axios');
  const mongoose = require('mongoose');
  require('dotenv').config();

  const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/bliss';
  await mongoose.connect(MONGO);

  const phone = '+15551234567';
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: 'pnid_1' },
              messages: [
                {
                  from: phone,
                  id: `mid_${Date.now()}`,
                  timestamp: Math.floor(Date.now() / 1000),
                  text: { body: 'STOP' },
                  type: 'text',
                },
              ],
            },
          },
        ],
      },
    ],
  };

  try {
    console.log('Posting webhook payload to /api/whatsapp/webhook');
    const r = await axios.post('http://localhost:3000/api/whatsapp/webhook', payload, { headers: { 'content-type': 'application/json' } });
    console.log('POST status:', r.status);
  } catch (err) {
    console.error('POST error:', err.response ? err.response.status : err.message);
  }

  // Wait a short while for background processing to complete
  await new Promise(r => setTimeout(r, 2000));

  try {
    const WhatsAppMessageLog = require('../models/WhatsAppMessageLog');
    const docs = await WhatsAppMessageLog.find({ phoneNumber: phone }).sort({ createdAt: -1 }).limit(10).lean();
    console.log('Found WhatsAppMessageLog entries:', docs.length);
    console.log(docs.map(d => ({ phoneNumber: d.phoneNumber, status: d.status, content: d.content, eventType: d.eventType })));
  } catch (err) {
    console.error('Query error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
