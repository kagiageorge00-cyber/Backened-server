jest.mock('../models/Message', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../models/Conversation', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../models/Deployment', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/Notification', () => ({
  create: jest.fn(),
}));

jest.mock('../models/Interview', () => ({
  findOne: jest.fn(),
}));

jest.mock('../middleware/employerAuth', () => (req, res, next) => {
  req.employer = { employerId: 'EMP-1' };
  next();
});

jest.mock('../middleware/jwtAuth', () => (req, res, next) => {
  req.candidate = {
    _id: 'candidate-mongo-id',
    uniqueCode: 'CAND-1',
    fullName: 'Candidate One',
  };
  next();
});

const express = require('express');
const request = require('supertest');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Deployment = require('../models/Deployment');
const Candidate = require('../models/candidate');
const Notification = require('../models/Notification');
const Interview = require('../models/Interview');
const messagesRouter = require('../routes/messages');
const candidateApiRouter = require('../routes/candidate_api');

describe('Interview messaging', () => {
  const app = express();

  app.use(express.json());
  app.use('/api/messages', messagesRouter);
  app.use('/api/candidate_portal', candidateApiRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    Conversation.findOne.mockResolvedValue({
      _id: 'conversation-1',
      save: jest.fn(),
    });
    const candidate = {
      _id: 'candidate-mongo-id',
      uniqueCode: 'CAND-1',
      candidateId: 'CAND-1',
    };
    Candidate.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(candidate),
    });
    Deployment.findOne.mockResolvedValue(null);
    Message.create.mockResolvedValue({ _id: 'message-1' });
    Message.findOne.mockResolvedValue(null);
    Notification.create.mockResolvedValue({});
    Interview.findOne.mockResolvedValue({ interviewId: 'INT-1' });
  });

  test('allows employer messages in the active interview chat', async () => {
    Interview.findOne.mockResolvedValue({ interviewId: 'INT-1' });

    const response = await request(app)
      .post('/api/messages/send')
      .send({
        conversationId: 'conversation-1',
        senderId: 'EMP-1',
        receiverId: 'CAND-1',
        message: 'Hello, your interview is ready.',
      });

    expect(response.status).toBe(201);
    expect(Interview.findOne).toHaveBeenCalledWith(expect.objectContaining({
      employerId: 'EMP-1',
      chatChannelId: 'conversation-1',
      interviewStatus: 'accepted',
      meetingStatus: 'active',
    }));
    expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
      senderType: 'employer',
      conversationId: 'conversation-1',
    }));
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'CAND-1',
      userType: 'candidate',
    }));
  });

  test('does not allow employer messages outside an active interview or deployment', async () => {
    Interview.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/messages/send')
      .send({
        conversationId: 'conversation-1',
        senderId: 'EMP-1',
        receiverId: 'CAND-1',
        message: 'Hello',
      });

    expect(response.status).toBe(403);
    expect(Message.create).not.toHaveBeenCalled();
  });

  test('does not save candidate replies outside an active interview or deployment', async () => {
    Interview.findOne.mockResolvedValue(null);
    Conversation.findById.mockResolvedValue({
      _id: 'conversation-1',
      participants: ['EMP-1', 'candidate-mongo-id'],
      save: jest.fn(),
    });

    const response = await request(app)
      .post('/api/candidate_portal/conversations/conversation-1/messages')
      .send({
        text: 'Not during this interview.',
        clientMessageId: 'candidate-message-blocked',
      });

    expect(response.status).toBe(403);
    expect(Message.create).not.toHaveBeenCalled();
    expect(Notification.create).not.toHaveBeenCalled();
  });

  test('delivers candidate replies to the employer conversation and notifies the employer', async () => {
    Conversation.findById.mockResolvedValue({
      _id: 'conversation-1',
      participants: ['EMP-1', 'candidate-mongo-id'],
      save: jest.fn(),
    });

    const response = await request(app)
      .post('/api/candidate_portal/conversations/conversation-1/messages')
      .send({
        text: 'Thank you, I am ready.',
        clientMessageId: 'candidate-message-1',
      });

    expect(response.status).toBe(201);
    expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({
      senderId: 'candidate-mongo-id',
      receiverId: 'EMP-1',
      senderType: 'candidate',
      conversationId: 'conversation-1',
    }));
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'EMP-1',
      userType: 'employer',
      title: 'New Message from Candidate',
    }));
  });
});
