require('dotenv').config({ path: __dirname + '/.env' });
const email = require('./email');

async function run() {
  try {
    console.log('Testing Resend email send...');
    const ok = await email.notifyPaymentSuccess({ email: 'kagiageorge00@gmail.com', name: 'Kagi Test' });
    console.log('Resend test result:', ok);
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err && (err.stack || err.message || err));
    process.exit(1);
  }
}

run();
