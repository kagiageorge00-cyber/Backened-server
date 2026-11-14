const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

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

jest.mock('../services/fcmService', () => ({
  sendToTokens: jest.fn().mockResolvedValue({
    sent: 1,
    failed: 0,
    total: 1,
    errors: [],
  }),
}));

jest.mock('../models/RegistrationEvent', () => ({
  create: jest.fn().mockResolvedValue({ id: 'REG-TEST-1' }),
}));

jest.mock('../models/AdminAction', () => ({
  create: jest.fn().mockResolvedValue({ id: 'AUDIT-TEST-1' }),
}));

const PushToken = require('../models/PushToken');
const fcmService = require('../services/fcmService');

describe('notification and audit endpoints', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('registers a browser token for the selected user', async () => {
    const accessToken = jwt.sign(
      { blissId: 'CAND-TEST-1', role: 'candidate' },
      process.env.BLISS_JWT_SECRET || 'bliss-auth-secret',
    );
    const res = await request(app)
      .post('/api/notifications/register-token')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: 'CAND-TEST-1',
        userType: 'customer',
        token: 'fcm-test-token',
        platform: 'web',
        marketingOptIn: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(PushToken.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'CAND-TEST-1', token: 'fcm-test-token' },
      {
        $set: expect.objectContaining({
          userId: 'CAND-TEST-1',
          userType: 'customer',
          token: 'fcm-test-token',
          platform: 'web',
          marketingOptIn: true,
          marketingOptInAt: expect.any(Date),
        }),
      },
      { upsert: true },
    );
  });

  it('does not allow registering a push token for a different account', async () => {
    const accessToken = jwt.sign(
      { blissId: 'CAND-TEST-1', role: 'candidate' },
      process.env.BLISS_JWT_SECRET || 'bliss-auth-secret',
    );
    const res = await request(app)
      .post('/api/notifications/register-token')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: 'BLISS-OTHER-1',
        token: 'fcm-test-token',
        platform: 'web',
      });

    expect(res.status).toBe(403);
    expect(PushToken.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('sends a push through FCM to the registered device token', async () => {
    const tokens = [{ token: 'fcm-test-token' }];
    PushToken.find.mockResolvedValue(tokens);

    const res = await request(app)
      .post('/api/notifications/send-push')
      .send({
        userId: 'CAND-TEST-1',
        title: 'Test notification',
        message: 'Push delivery test',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      sent: 1,
      failed: 0,
      total: 1,
    });
    expect(fcmService.sendToTokens).toHaveBeenCalledWith(tokens, {
      title: 'Test notification',
      message: 'Push delivery test',
    });
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
