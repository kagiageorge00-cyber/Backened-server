const http = require('http');
const PORT = process.env.PORT || 5000;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {},
      timeout: 5000,
    };
    const req = http.request(options, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: buf });
      });
    });
    req.on('error', err => reject(err));
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('SMOKE TEST START - port', PORT);
    let r;

    r = await request('GET', '/');
    console.log('/ GET', r.statusCode, r.body);

    r = await request('POST', '/register', { name: 'Test User', email: `test+${Date.now()}@example.com` });
    console.log('/register POST', r.statusCode, r.body);

    r = await request('POST', '/flightSearch', { origin: 'NYC', destination: 'LAX', date: '2026-06-01' });
    console.log('/flightSearch POST', r.statusCode, r.body);

    r = await request('POST', '/hotelSearch', { city: 'Los Angeles' });
    console.log('/hotelSearch POST', r.statusCode, r.body);

    r = await request('POST', '/payment', { userId: 1, amount: 123.45 });
    console.log('/payment POST', r.statusCode, r.body);

    console.log('SMOKE TEST COMPLETE');
    process.exit(0);
  } catch (err) {
    console.error('SMOKE TEST ERROR', err.message);
    process.exit(2);
  }
})();
