require('dotenv').config();
const { sendEmail } = require('./email');

(async () => {
  try {
    console.log('Starting test send to kagiageorge00@gmail.com');
    const ok = await sendEmail(
      'kagiageorge00@gmail.com',
      'Test: Bliss Connect email delivery',
      'This is a plain-text test from the backend.',
      `<div>
         <p>This is an automated test message from Bliss Connect backend.</p>
         <p>If you received this, email delivery is working.</p>
       </div>`
    );
    console.log('sendEmail returned:', ok);
  } catch (err) {
    console.error('Test send failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
