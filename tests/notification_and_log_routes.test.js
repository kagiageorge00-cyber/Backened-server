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
  countDocuments: jest.fn().mockResolvedValue(0),
}));

jest.mock('../models/PushToken', () => ({
  find: jest.fn().mockResolvedValue([]),
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
}));

jest.mock('../models/Employer', () => ({
  findOne: jest.fn(),
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
const Employer = require('../models/Employer');
const Notification = require('../models/Notification');
const fcmService = require('../services/fcmService');
const originalJwtSecret = process.env.JWT_SECRET;

function staffToken() {
  return jwt.sign(
    {
      sub: 'STAFF-1',
      email: 'staff@example.com',
      rank: 'Staff',
    },
    process.env.JWT_SECRET,
  );
}

function employerToken(employerId = 'EMP-1') {
  return jwt.sign({ employerId }, process.env.JWT_SECRET);
}

describe('notification and audit endpoints', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'notification-test-secret';
  });

  afterAll(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Employer.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ employerId: 'EMP-1' }),
    });
    Notification.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    app = express();
    app.use(express.json());
    app.use('/api/notifications', require('../routes/notifications'));
    app.use('/api/logs', require('../routes/logs'));
  });

  it('sends a multi-channel notification payload', async () => {
    const res = await request(app)
      .post('/api/notifications/send')
      .set('Authorization', `Bearer ${staffToken()}`)
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

  it('registers a browser token for the authenticated staff account', async () => {
    const accessToken = jwt.sign({
      sub: 'STAFF-1',
      email: 'Agent@Example.com',
      department: 'Customer Care',
      rank: 'Staff',
    }, process.env.JWT_SECRET);
    const res = await request(app)
      .post('/api/notifications/register-token')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: 'agent@example.com',
        userType: 'staff',
        token: 'staff-fcm-test-token',
        platform: 'web',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(PushToken.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'agent@example.com', token: 'staff-fcm-test-token' },
      {
        $set: expect.objectContaining({
          userId: 'agent@example.com',
          userType: 'staff',
          token: 'staff-fcm-test-token',
          platform: 'web',
        }),
      },
      { upsert: true },
    );
  });

  it('sends a push through FCM to the registered device token', async () => {
    const tokens = [{ token: 'fcm-test-token' }];
    PushToken.find.mockResolvedValue(tokens);

    const res = await request(app)
      .post('/api/notifications/send-push')
      .set('Authorization', `Bearer ${staffToken()}`)
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

  it.each([
    ['send', '/send', { userId: 'CAND-TEST-1', message: 'Unauthorized' }],
    ['create', '/create', { userId: 'CAND-TEST-1', title: 'Unauthorized', message: 'No' }],
    ['send-push', '/send-push', { userId: 'CAND-TEST-1', message: 'Unauthorized' }],
  ])('rejects unauthenticated notification %s requests', async (_name, route, body) => {
    const res = await request(app).post(`/api/notifications${route}`).send(body);

    expect(res.status).toBe(401);
  });

  it('rejects authenticated customer tokens from privileged send routes', async () => {
    const customerToken = jwt.sign(
      { blissId: 'CAND-TEST-1', role: 'candidate' },
      process.env.BLISS_JWT_SECRET || 'bliss-auth-secret',
    );
    const res = await request(app)
      .post('/api/notifications/send')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ userId: 'CAND-TEST-1', message: 'Not a staff action' });

    expect(res.status).toBe(401);
  });

  it.each([
    ['notification list', 'get', '/EMP-1'],
    ['typed notification list', 'get', '/user/employer/EMP-1'],
    ['mark-read', 'patch', '/NOT-TEST-1/read'],
  ])('requires authentication for the %s route', async (_name, method, route) => {
    const res = await request(app)[method](`/api/notifications${route}`);

    expect(res.status).toBe(401);
  });

  it('does not allow staff token registration with the fallback secret when JWT_SECRET is unset', async () => {
    const configuredSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      const accessToken = jwt.sign(
        { sub: 'STAFF-1', email: 'staff@example.com', rank: 'Staff' },
        'bliss-staff-secret',
      );
      const res = await request(app)
        .post('/api/notifications/register-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId: 'staff@example.com', userType: 'staff', token: 'forged-token' });

      expect(res.status).toBe(401);
      expect(PushToken.findOneAndUpdate).not.toHaveBeenCalled();
    } finally {
      process.env.JWT_SECRET = configuredSecret;
    }
  });

  it('rejects attempts to list another employer\'s notifications', async () => {
    const res = await request(app)
      .get('/api/notifications/EMP-2')
      .set('Authorization', `Bearer ${employerToken()}`);

    expect(res.status).toBe(403);
  });

  it('allows an employer to list only their own notifications', async () => {
    const res = await request(app)
      .get('/api/notifications/EMP-1')
      .set('Authorization', `Bearer ${employerToken()}`);

    expect(res.status).toBe(200);
    expect(Notification.find).toHaveBeenCalledWith({
      userId: 'EMP-1',
      userType: 'employer',
    });
    expect(Notification.countDocuments).toHaveBeenCalledWith({
      userId: 'EMP-1',
      userType: 'employer',
    });
  });

  it('scopes notification read updates to the authenticated employer', async () => {
    await request(app)
      .patch('/api/notifications/NOT-TEST-1/read')
      .set('Authorization', `Bearer ${employerToken()}`);

    expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
      {
        notificationId: 'NOT-TEST-1',
        userId: 'EMP-1',
        userType: 'employer',
      },
      { isRead: true },
      { new: true },
    );
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
