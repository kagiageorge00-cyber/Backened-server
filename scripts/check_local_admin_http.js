const https = require('https');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const backendUrl = process.env.BACKEND_URL || 'https://backened_server_1.onrender.com';
  const backendHost = new URL(backendUrl).hostname;

  try {
    const notif = await request({ hostname: backendHost, port: 443, path: '/api/admin/notifications', method: 'GET' });
    console.log('NOTIFICATIONS', notif.statusCode, notif.body);

    const count = await request({ hostname: backendHost, port: 443, path: '/api/admin/notifications/unread/count', method: 'GET' });
    console.log('COUNT', count.statusCode, count.body);

    const loginBody = JSON.stringify({ username: 'boss', password: 'boss@bliss' });
    const login = await request({ hostname: backendHost, port: 443, path: '/api/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) } }, loginBody);
    console.log('LOGIN', login.statusCode, login.body);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
