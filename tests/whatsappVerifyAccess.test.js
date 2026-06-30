const express = require('express');
const request = require('supertest');
const { signAdminToken } = require('../middleware/adminAuth');

jest.mock('../services/whatsappCloudService', () => ({
  sendTextMessage: jest.fn(),
  sendTestMessage: jest.fn(),
  sendTemplateMessage: jest.fn(),
  sendMediaMessage: jest.fn(),
  sendInteractiveMessage: jest.fn(),
  sendBulkMessages: jest.fn(),
  getConfig: jest.fn(() => ({})),
  validateConfig: jest.fn(() => true),
  getWhatsAppDebugReport: jest.fn(),
  getWhatsAppAssetsReport: jest.fn(),
  validateWhatsAppCredentials: jest.fn(),
  verifyWhatsAppAccess: jest.fn(),
}));

describe('GET /api/admin/whatsapp/verify-access', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-token-12345';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'phone-123';
    process.env.WHATSAPP_WABA_ID = 'waba-456';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns env and Meta API results for the diagnostic endpoint', async () => {
    const whatsappService = require('../services/whatsappCloudService');
    whatsappService.verifyWhatsAppAccess.mockResolvedValue({
      env: {
        wabaId: 'waba-456',
        phoneNumberId: 'phone-123',
        tokenConfigured: true,
      },
      results: {
        me: { status: 200, ok: true, body: { id: 'me-id', name: 'Test App' }, errorBody: null, rawBody: '{"id":"me-id","name":"Test App"}' },
        waba: { status: 200, ok: true, body: { id: 'waba-456', name: 'WABA' }, errorBody: null, rawBody: '{"id":"waba-456","name":"WABA"}' },
        phoneNumber: { status: 200, ok: true, body: { id: 'phone-123', display_phone_number: '+15551234567', verified_name: 'Bliss' }, errorBody: null, rawBody: '{"id":"phone-123","display_phone_number":"+15551234567","verified_name":"Bliss"}' },
        phoneNumbers: { status: 200, ok: true, body: { data: [{ id: 'phone-123' }] }, errorBody: null, rawBody: '{"data":[{"id":"phone-123"}]}' },
      },
      requests: [],
    });

    const adminRouter = require('../routes/admin');
    const app = express();
    app.use('/api/admin', adminRouter);

    const token = signAdminToken({ username: 'boss', role: 'admin' });
    const response = await request(app)
      .get('/api/admin/whatsapp/verify-access')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.env).toEqual({
      wabaId: 'waba-456',
      phoneNumberId: 'phone-123',
      tokenConfigured: true,
    });
    expect(response.body.me).toBeDefined();
    expect(response.body.waba).toBeDefined();
    expect(response.body.phoneNumber).toBeDefined();
    expect(response.body.phoneNumbers).toBeDefined();
    expect(response.body.me.status).toBe(200);
  });
});
