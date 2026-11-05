jest.mock('../models/Interview', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../models/Employer', () => ({
  find: jest.fn(),
}));

jest.mock('../middleware/employerAuth', () => jest.fn((req, res, next) => {
  req.employer = {
    employerId: 'EMP-1',
    status: 'active',
    verificationStatus: 'verified_employer',
    companyName: 'Demo Co',
  };
  next();
}));

jest.mock('../services/rtcService', () => ({
  ...jest.requireActual('../services/rtcService'),
  generateRtcSession: jest.fn().mockResolvedValue({
    provider: 'agora',
    appId: 'agora-app-id',
    token: 'rtc-token',
    channelName: 'interview_INT-1',
    uid: 0,
  }),
}));

jest.mock('../utils/notificationHelper', () => ({
  createNotification: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const Candidate = require('../models/candidate');
const Employer = require('../models/Employer');
const Interview = require('../models/Interview');
const interviewsRouter = require('../routes/interviews');

describe('Interview booking candidate lookup', () => {
  const app = express();

  app.use(express.json());
  app.use('/api/interviews', interviewsRouter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('looks up candidate codes without treating them as Mongo object IDs', async () => {
    Candidate.findOne.mockResolvedValue({
      _id: 'mongo-candidate-id',
      candidateId: 'CAND-2026-3741',
      uniqueCode: 'CAND-2026-3741',
      fullName: 'Esther Lorna Kombo',
      isVerified: true,
      status: 'available',
    });
    Interview.create.mockResolvedValue({
      interviewId: 'INT-1',
      candidateId: 'CAND-2026-3741',
    });

    const response = await request(app)
      .post('/api/interviews/request')
      .send({
        candidateId: 'CAND-2026-3741',
        interviewDate: '2026-11-02',
        interviewTime: '8:35 AM',
        interviewType: 'video_call',
        meetingLink: 'https://external-meeting.example',
      });

    expect(response.status).toBe(201);
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [
        { candidateId: 'CAND-2026-3741' },
        { uniqueCode: 'CAND-2026-3741' },
        { phone: 'CAND-2026-3741' },
        { email: 'CAND-2026-3741' },
      ],
    });
    expect(Interview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        interviewTime: '8:35 AM',
        interviewType: 'video',
        meetingLink: null,
      }),
    );
  });

  test('requires an interview time when booking', async () => {
    const response = await request(app)
      .post('/api/interviews/request')
      .send({
        candidateId: 'CAND-2026-3741',
        interviewDate: '2026-11-02',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('interviewTime');
    expect(Candidate.findOne).not.toHaveBeenCalled();
  });

  test('keeps ObjectId lookup available for actual Mongo IDs', async () => {
    const candidateId = '507f1f77bcf86cd799439011';
    Candidate.findOne.mockResolvedValue({
      _id: candidateId,
      candidateId,
      isVerified: true,
      status: 'available',
    });
    Interview.create.mockResolvedValue({
      interviewId: 'INT-2',
      candidateId,
    });

    const response = await request(app)
      .post('/api/interviews/request')
      .send({
        candidateId,
        interviewDate: '2026-11-02',
        interviewTime: '8:35 AM',
      });

    expect(response.status).toBe(201);
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: expect.arrayContaining([{ _id: candidateId }]),
    });
  });

  test('includes the employer company name in candidate interview records', async () => {
    Interview.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        {
          employerId: 'EMP-1',
          toObject: () => ({
            interviewId: 'INT-1',
            interviewType: 'video',
            interviewStatus: 'requested',
            notes: 'Bring your portfolio',
          }),
        },
      ]),
    });
    Employer.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { employerId: 'EMP-1', companyName: 'Demo Co' },
        ]),
      }),
    });

    const response = await request(app).get('/api/interviews/candidate/CAND-1');

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({
      interviewId: 'INT-1',
      employerName: 'Demo Co',
      interviewType: 'video',
      interviewStatus: 'requested',
      notes: 'Bring your portfolio',
    });
  });

  test('starts a booked interview and returns fresh RTC credentials', async () => {
    const interview = {
      interviewId: 'INT-1',
      employerId: 'EMP-1',
      candidateId: 'CAND-1',
      interviewType: 'video',
      channelName: 'interview_INT-1',
      save: jest.fn(),
    };
    Interview.findOne.mockResolvedValue(interview);

    const response = await request(app)
      .post('/api/interviews/INT-1/start')
      .send({});

    expect(response.status).toBe(200);
    expect(Interview.findOne).toHaveBeenCalledWith({
      interviewId: 'INT-1',
      employerId: 'EMP-1',
    });
    expect(interview).toMatchObject({
      meetingStatus: 'active',
      interviewStatus: 'accepted',
      channelName: 'interview_INT-1',
      rtcAppId: 'agora-app-id',
      agoraToken: 'rtc-token',
    });
    expect(interview.save).toHaveBeenCalled();
    expect(response.body.interview.rtcAppId).toBe('agora-app-id');
  });
});
