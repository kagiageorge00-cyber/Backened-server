(async ()=>{
  const axios = require('axios');
  const u = 'http://localhost:3000';
  try {
    let r = await axios.get(u + '/api/health');
    console.log('/api/health', r.status);
    console.log(JSON.stringify(r.data));

    r = await axios.get(u + '/api/admin/health');
    console.log('/api/admin/health', r.status);
    console.log(JSON.stringify(r.data));

    try {
      r = await axios.post(u + '/api/admin/login', { username: 'admin', password: 'wrongpass' });
    } catch (err) {
      r = err.response || { status: 'ERR', data: err.message };
    }
    console.log('/api/admin/login', r.status);
    console.log(JSON.stringify(r.data || r));

    r = await axios.get(u + '/api/whatsapp/webhook', { params: { 'hub.mode': 'subscribe', 'hub.verify_token': 'bliss_whatsapp_verify_token', 'hub.challenge': 'CHALLENGE' } });
    console.log('/api/whatsapp/webhook (GET)', r.status);
    console.log(r.data);
  } catch (e) {
    console.error('smoke test error', e.stack || e.message);
    process.exit(1);
  }
})();
