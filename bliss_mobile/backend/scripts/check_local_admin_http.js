const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
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
  try {
    const notif = await request({ host: 'localhost', port: 3000, path: '/api/admin/notifications', method: 'GET' });
    console.log('NOTIFICATIONS', notif.statusCode, notif.body);

    const count = await request({ host: 'localhost', port: 3000, path: '/api/admin/notifications/unread/count', method: 'GET' });
    console.log('COUNT', count.statusCode, count.body);

    const loginBody = JSON.stringify({ username: 'boss', password: 'boss123' });
    const login = await request({ host: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) } }, loginBody);
    console.log('LOGIN', login.statusCode, login.body);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
