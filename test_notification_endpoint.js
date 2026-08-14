const axios = require('axios');

(async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/notifications/send', {
      recipientEmail: 'kagiageorge00@gmail.com',
      phoneNumber: '+254708715024',
      candidateName: 'George Kagia'
    }, { timeout: 10000 });
    console.log('SUCCESS:', JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.log('ERROR:', e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
  }
  process.exit(0);
})();
