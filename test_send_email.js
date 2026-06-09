require('dotenv').config({ path: __dirname + '/.env' });
const email = require('./email');

async function run() {
  try {
    console.log('Running test send...');
    const ok = await email.notifyPaymentSuccess({ email: 'yourtest@example.com', name: 'Test User' });
    console.log('Result:', ok);
    process.exit(0);
  } catch (err) {
    console.error('Test send error:', err && (err.stack || err.message || err));
    process.exit(1);
  }
}

run();
