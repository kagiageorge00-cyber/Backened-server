const express = require('express');
const request = require('supertest');

jest.mock('../email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../whatsapp', () => ({
  sendWhatsAppMessage: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../utils/notificationHelper', () => ({
  createNotification: jest.fn().mockResolvedValue({ notificationId: 'NOT-TEST-1' }),
}));

jest.mock('../models/Notification', () => ({
  create: jest.fn().mockResolvedValue({ notificationId: 'NOT-TEST-1' }),
  findOneAndUpdate: jest.fn().mockResolvedValue({ notificationId: 'NOT-TEST-1' }),
  find: jest.fn().mockResolvedValue([]),
}));

jest.mock('../models/PushToken', () => ({
  find: jest.fn().mockResolvedValue([]),
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
}));

jest.mock('../models/RegistrationEvent', () => ({
  create: jest.fn().mockResolvedValue({ id: 'REG-TEST-1' }),
}));

jest.mock('../models/AdminAction', () => ({
  create: jest.fn().mockResolvedValue({ id: 'AUDIT-TEST-1' }),
}));

describe('notification and audit endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/notifications', require('../routes/notifications'));
    app.use('/api/logs', require('../routes/logs'));
  });

  it('sends a multi-channel notification payload', async () => {
    const res = await request(app)
      .post('/api/notifications/send')
      .send({
        type: 'email',
        recipientEmail: 'user@example.com',
        phoneNumber: '+254700000000',
        candidateName: 'Jane Doe',
        candidateId: 'CAND-TEST-1',
        subject: 'Welcome',
        templateName: 'welcome',
        data: { portalLoginLink: 'https://example.com/login' },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.channels).toBeDefined();
  });

  it('stores registration audit events', async () => {
    const res = await request(app)
      .post('/api/logs/registration')
      .send({
        candidateId: 'CAND-TEST-1',
        eventType: 'registration_completed',
        details: { username: 'jane' },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('stores admin audit actions', async () => {
    const res = await request(app)
      .post('/api/logs/admin-actions')
      .send({
        adminId: 'ADMIN-TEST-1',
        action: 'payment_approved',
        candidateId: 'CAND-TEST-1',
        details: { amount: 5000 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
