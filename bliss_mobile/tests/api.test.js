const request = require('supertest');
const app = require('../backend/server');

describe('API Tests', () => {
  it('should search flights', async () => {
    const res = await request(app)
      .post('/flightSearch')
      .send({
        origin: 'Nairobi',
        destination: 'Dubai',
        date: '2026-06-01',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.flights)).toBe(true);
  });

  it('should register a user', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Test User',
        email: 'test@test.com',
        phone: '254700000001',
        userType: 'candidate'
      });
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
  });

  it('should submit a payment', async () => {
    const res = await request(app)
      .post('/payment')
      .send({
        userId: 1,
        amount: 1000
      });
    expect(res.body.success).toBe(true);
    expect(res.body.transactionId).toBeDefined();
  });
});
