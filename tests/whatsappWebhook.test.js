const request = require('supertest');
const app = require('../server');

describe('WhatsApp webhook verification', () => {
  const originalVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const originalWebhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  afterEach(() => {
    if (originalVerifyToken === undefined) delete process.env.WHATSAPP_VERIFY_TOKEN;
    else process.env.WHATSAPP_VERIFY_TOKEN = originalVerifyToken;

    if (originalWebhookVerifyToken === undefined) delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    else process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = originalWebhookVerifyToken;
  });

  test('GET /api/whatsapp/webhook verifies against WHATSAPP_VERIFY_TOKEN', async () => {
    process.env.WHATSAPP_VERIFY_TOKEN = 'meta-token';
    delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    const res = await request(app)
      .get('/api/whatsapp/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'meta-token',
        'hub.challenge': '12345',
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('12345');
  });

  test('POST /api/whatsapp/webhook accepts events and returns 200', async () => {
    const res = await request(app)
      .post('/api/whatsapp/webhook')
      .send({ object: 'whatsapp_business_account', entry: [] });

    expect(res.status).toBe(200);
  });
});
