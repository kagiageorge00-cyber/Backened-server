const request = require('supertest');

jest.mock('../../functions/flightSearch', () => ({
  searchFlights: async () => []
}));

const app = require('../server');

describe('Core API endpoint health checks', () => {
  test('root health endpoint responds successfully', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('/api/health responds successfully', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('/api/admin/health responds successfully', async () => {
    const res = await request(app).get('/api/admin/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('/register endpoint accepts required fields', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: 'Test', email: 'test@example.com', phone: '1234567890', userType: 'candidate' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('/payment endpoint accepts required fields', async () => {
    const res = await request(app)
      .post('/payment')
      .send({ userId: 'user-1', amount: 100 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transactionId).toBeDefined();
  });

  test('/flightSearch responds successfully with a flight array', async () => {
    const res = await request(app)
      .post('/flightSearch')
      .send({ origin: 'NBO', destination: 'JFK', date: '2025-01-01' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.flights)).toBe(true);
  });
});
