const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock the admin session
const adminSessions = new Map();
const adminUsername = 'admin@bliss';
const adminPassword = 'TestAdmin@123';

// Mock models and utilities
jest.mock('../models/Notification');
jest.mock('../models/Payment');
jest.mock('../models/Candidate');
jest.mock('../utils/adminNotificationHelper', () => ({
  notifyPaymentApproved: jest.fn().mockResolvedValue({}),
  notifyPaymentRejected: jest.fn().mockResolvedValue({}),
  notifyPaymentSubmitted: jest.fn().mockResolvedValue({}),
  notifyInterviewRequested: jest.fn().mockResolvedValue({}),
  notifyDeploymentCreated: jest.fn().mockResolvedValue({}),
}));
jest.mock('../utils/notificationHelper', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

// Mock email service
jest.mock('../email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock auth middleware
const requireAdminAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  req.adminId = adminUsername;
  next();
};

// Mock Notification model
const Notification = require('../models/Notification');

describe('Admin Notification Center', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock login endpoint
    app.post('/api/admin/login', (req, res) => {
      const { username, password } = req.body;
      if (username === adminUsername && password === adminPassword) {
        const token = 'mock-token-' + Date.now();
        adminSessions.set(token, {
          username,
          loginTime: Date.now(),
          expiresAt: Date.now() + 3600000,
        });
        res.json({ success: true, token });
      } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    });

    // Mock GET /api/admin/notifications
    app.get('/api/admin/notifications', requireAdminAuth, async (req, res) => {
      try {
        const { limit = 50, skip = 0, category, isRead } = req.query;
        const filter = { userType: 'admin' };
        
        if (category && category !== 'all') {
          filter.category = category;
        }
        if (isRead !== undefined) {
          filter.isRead = isRead === 'true';
        }

        const notifications = await Notification.find(filter)
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .skip(parseInt(skip));

        const total = await Notification.countDocuments(filter);
        const unread = await Notification.countDocuments({
          ...filter,
          isRead: false,
        });

        res.json({
          success: true,
          data: notifications,
          total,
          unread,
          count: notifications.length,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Mock GET /api/admin/notifications/unread/count
    app.get('/api/admin/notifications/unread/count', requireAdminAuth, async (req, res) => {
      try {
        const unread = await Notification.countDocuments({
          userType: 'admin',
          isRead: false,
        });
        res.json({ success: true, unread });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Mock PATCH /api/admin/notifications/:notificationId/read
    app.patch(
      '/api/admin/notifications/:notificationId/read',
      requireAdminAuth,
      async (req, res) => {
        try {
          const { notificationId } = req.params;
          const notification = await Notification.findOneAndUpdate(
            { notificationId },
            { isRead: true },
            { new: true }
          );

          if (!notification) {
            return res
              .status(404)
              .json({ success: false, error: 'Notification not found' });
          }

          res.json({ success: true, data: notification });
        } catch (err) {
          res.status(500).json({ success: false, error: err.message });
        }
      }
    );

    // Mock PATCH /api/admin/notifications/read-all
    app.patch('/api/admin/notifications/read-all', requireAdminAuth, async (req, res) => {
      try {
        const result = await Notification.updateMany(
          { userType: 'admin', isRead: false },
          { isRead: true }
        );

        res.json({
          success: true,
          modifiedCount: result.modifiedCount,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Mock DELETE /api/admin/notifications/:notificationId
    app.delete(
      '/api/admin/notifications/:notificationId',
      requireAdminAuth,
      async (req, res) => {
        try {
          const { notificationId } = req.params;
          await Notification.findOneAndDelete({ notificationId });
          res.json({ success: true, message: 'Notification deleted' });
        } catch (err) {
          res.status(500).json({ success: false, error: err.message });
        }
      }
    );

    // Mock DELETE /api/admin/notifications
    app.delete('/api/admin/notifications', requireAdminAuth, async (req, res) => {
      try {
        const result = await Notification.deleteMany({ userType: 'admin' });
        res.json({
          success: true,
          deletedCount: result.deletedCount,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Mock GET /api/admin/notifications/search/query
    app.get(
      '/api/admin/notifications/search/query',
      requireAdminAuth,
      async (req, res) => {
        try {
          const { q, category } = req.query;
          const filter = { userType: 'admin' };

          if (q) {
            filter.$or = [
              { title: { $regex: q, $options: 'i' } },
              { message: { $regex: q, $options: 'i' } },
              { candidateName: { $regex: q, $options: 'i' } },
              { employerName: { $regex: q, $options: 'i' } },
            ];
          }

          if (category && category !== 'all') {
            filter.category = category;
          }

          const notifications = await Notification.find(filter).sort({
            createdAt: -1,
          });

          res.json({
            success: true,
            data: notifications,
            count: notifications.length,
          });
        } catch (err) {
          res.status(500).json({ success: false, error: err.message });
        }
      }
    );
  });

  describe('Authentication', () => {
    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({
          username: adminUsername,
          password: adminPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    test('should reject with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'wrong',
          password: 'wrong',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should reject request without auth token', async () => {
      const res = await request(app).get('/api/admin/notifications');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/notifications', () => {
    let token;

    beforeEach(() => {
      token = 'mock-token-' + Date.now();
      adminSessions.set(token, {
        username: adminUsername,
        loginTime: Date.now(),
        expiresAt: Date.now() + 3600000,
      });

      // Mock database response
      Notification.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([
              {
                notificationId: 'notif-1',
                userType: 'admin',
                title: 'Payment Approved',
                message: 'Payment from John approved',
                category: 'payment',
                candidateName: 'John Doe',
                amount: 1300,
                currency: 'KES',
                isRead: false,
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      });

      Notification.countDocuments = jest.fn()
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unread
    });

    test('should fetch notifications', async () => {
      const res = await request(app)
        .get('/api/admin/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    test('should filter by category', async () => {
      const res = await request(app)
        .get('/api/admin/notifications?category=payment')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should filter by read status', async () => {
      const res = await request(app)
        .get('/api/admin/notifications?isRead=false')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should support pagination', async () => {
      const res = await request(app)
        .get('/api/admin/notifications?limit=10&skip=0')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/notifications/unread/count', () => {
    let token;

    beforeEach(() => {
      token = 'mock-token-' + Date.now();
      adminSessions.set(token, {
        username: adminUsername,
        loginTime: Date.now(),
        expiresAt: Date.now() + 3600000,
      });

      Notification.countDocuments = jest.fn().mockResolvedValue(5);
    });

    test('should return unread count', async () => {
      const res = await request(app)
        .get('/api/admin/notifications/unread/count')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unread).toBeDefined();
    });
  });

  describe('PATCH /api/admin/notifications/:notificationId/read', () => {
    let token;

    beforeEach(() => {
      token = 'mock-token-' + Date.now();
      adminSessions.set(token, {
        username: adminUsername,
        loginTime: Date.now(),
        expiresAt: Date.now() + 3600000,
      });

      Notification.findOneAndUpdate = jest.fn().mockResolvedValue({
        notificationId: 'notif-1',
        isRead: true,
      });
    });

    test('should mark notification as read', async () => {
      const res = await request(app)
        .patch('/api/admin/notifications/notif-1/read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });

    test('should return 404 if notification not found', async () => {
      Notification.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/admin/notifications/invalid/read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/admin/notifications/read-all', () => {
    let token;

    beforeEach(() => {
      token = 'mock-token-' + Date.now();
      adminSessions.set(token, {
        username: adminUsername,
        loginTime: Date.now(),
        expiresAt: Date.now() + 3600000,
      });

      Notification.updateMany = jest.fn().mockResolvedValue({
        modifiedCount: 5,
      });
    });

    test('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/admin/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.modifiedCount).toBe(5);
    });
  });

  describe('DELETE /api/admin/notifications/:notificationId', () => {
    let token;

    beforeEach(() => {
      token = 'mock-token-' + Date.now();
      adminSessions.set(token, {
        username: adminUsername,
        loginTime: Date.now(),
        expiresAt: Date.now() + 3600000,
      });

      Notification.findOneAndDelete = jest.fn().mockResolvedValue({
        notificationId: 'notif-1',
      });
    });

    test('should delete a notification', async () => {
      const res = await request(app)
        .delete('/api/admin/notifications/notif-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/admin/notifications', () => {
    let token;

    beforeEach(() => {
      token = 'mock-token-' + Date.now();
      adminSessions.set(token, {
        username: adminUsername,
        loginTime: Date.now(),
        expiresAt: Date.now() + 3600000,
      });

      Notification.deleteMany = jest.fn().mockResolvedValue({
        deletedCount: 10,
      });
    });

    test('should delete all notifications', async () => {
      const res = await request(app)
        .delete('/api/admin/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deletedCount).toBe(10);
    });
  });

  describe('GET /api/admin/notifications/search/query', () => {
    let token;

    beforeEach(() => {
      token = 'mock-token-' + Date.now();
      adminSessions.set(token, {
        username: adminUsername,
        loginTime: Date.now(),
        expiresAt: Date.now() + 3600000,
      });

      Notification.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          {
            notificationId: 'notif-1',
            title: 'Payment Approved',
            message: 'John payment approved',
            category: 'payment',
          },
        ]),
      });
    });

    test('should search notifications by query', async () => {
      const res = await request(app)
        .get('/api/admin/notifications/search/query?q=payment')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should search with category filter', async () => {
      const res = await request(app)
        .get('/api/admin/notifications/search/query?q=john&category=payment')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
