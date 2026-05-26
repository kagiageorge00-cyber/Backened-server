const request = require('supertest');
const app = require('../app'); // adjust path

describe('User Registration', () => {
  it('should register a user', async () => {

    // 🔥 create fake completed payment
    await require('../models/Payment').create({
      userId: '254700000001',
      amount: 1000,
      status: 'completed'
    });

    const res = await request(app)
      .post('/register')
      .send({
        name: 'Test User',
        email: 'test@test.com',
        phone: '254700000001',
        password: '123456',
        userType: 'candidate'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
  }, 20000);
});