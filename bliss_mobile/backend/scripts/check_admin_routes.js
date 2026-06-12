const request = require('supertest');
const app = require('../server');

(async () => {
  try {
    const notifRes = await request(app).get('/api/admin/notifications');
    console.log('NOTIFICATIONS:', notifRes.status, notifRes.text);

    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ username: 'boss', password: 'boss123' })
      .set('Content-Type', 'application/json');
    console.log('LOGIN:', loginRes.status, loginRes.text);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();
