// WhatsApp Cloud API service (TEST ONLY)
// Reads credentials from environment variables
// Usage: sendWhatsAppMessage(to, message)

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;
const API_URL = `https://graph.facebook.com/v25.0/${PHONE_ID}/messages`;

// Only allow sending to verified test numbers
const VERIFIED_TEST_NUMBERS = [
  // Example: '2547XXXXXXXX',
];

async function sendWhatsAppMessage(to, message) {
  if (!PHONE_ID || !TOKEN) {
    console.log('[WHATSAPP] Missing credentials');
    return { success: true, fallback: true, error: 'Missing credentials' };
  }
  if (!VERIFIED_TEST_NUMBERS.includes(to)) {
    console.log(`[WHATSAPP] Blocked: ${to} not in test numbers`);
    return { success: true, fallback: true, error: 'Not a test number' };
  }
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message },
  };
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log('[WHATSAPP] Response:', data);
    if (!res.ok) throw new Error(data.error?.message || 'WhatsApp API error');
    return { success: true, data };
  } catch (err) {
    console.log('[WHATSAPP] Fallback:', err.message);
    console.log('[WHATSAPP] Message:', { to, message });
    return { success: true, fallback: true, error: err.message };
  }
}

module.exports = { sendWhatsAppMessage };
