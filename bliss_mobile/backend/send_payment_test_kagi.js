require('dotenv').config({ path: __dirname + '/.env' });
const email = require('./email');

async function run() {
  try {
    console.log('Sending payment approval to kagiageorge00@gmail.com...');
    const ok = await email.notifyPaymentSuccess({ email: 'kagiageorge00@gmail.com', name: 'Kagi' });
    console.log('Result:', ok);
    process.exit(0);
  } catch (err) {
    console.error('Error sending test email:', err && (err.stack || err.message || err));
    process.exit(1);
  }
}

run();
