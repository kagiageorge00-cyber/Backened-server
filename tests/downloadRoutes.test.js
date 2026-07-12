const request = require('supertest');

jest.mock('../functions/flightSearch', () => ({
  searchFlights: async () => []
}), { virtual: true });

const app = require('../server');

describe('APK download endpoints', () => {
  test('/api/downloads/latest returns a usable download link even when the APK is missing', async () => {
    const res = await request(app).get('/api/downloads/latest');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.downloadUrl).toBeDefined();
  });
});
