jest.mock('../models/Payment', () => ({
  findOne: jest.fn().mockResolvedValue(null),
}));

jest.mock('../models/candidate', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({
    _id: 'cand_123',
    fullName: 'Test User',
    email: 'test@test.com',
    phone: '254700000001',
    uniqueCode: 'BLISS-123456',
    candidateId: 'cand_123',
  }),
}));

jest.mock('../services/notificationservice', () => ({
  notifyRegistrationSuccess: jest.fn(async () => true),
  notifyMarketplaceListing: jest.fn(async () => true),
}));

jest.mock('../utils/adminNotificationHelper', () => ({
  notifyCandidateRegistered: jest.fn(async () => true),
}));

const request = require('supertest');
const app = require('../app');
const Candidate = require('../models/candidate');
const bcrypt = require('bcryptjs');
const {
  notifyRegistrationSuccess,
} = require('../services/notificationservice');

describe('User Registration', () => {
  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/candidate/register')
      .send({
        fullName: 'Test User',
        email: 'test@test.com',
        phone: '254700000001',
        country: 'Kenya',
        photoUrl: 'https://example.com/photo.jpg',
        videoUrl: 'https://example.com/video.mp4',
        passportUrl: 'https://example.com/passport.pdf',
        medicalUrl: 'https://example.com/medical.pdf',
        conductUrl: 'https://example.com/conduct.pdf',
        skills: 'Testing',
        experience: '1 year',
      });

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.uniqueCode).toBeDefined();
    expect(res.body.password).toMatch(/^BLISS\d{4}$/);
    expect(notifyRegistrationSuccess).toHaveBeenCalled();
  }, 20000);

  it('should issue a temporary password when an existing candidate registers documents', async () => {
    const existingCandidate = {
      _id: 'cand_existing',
      fullName: 'Existing User',
      name: 'Existing User',
      email: 'existing@test.com',
      phone: '254700000002',
      photoUrl: 'https://example.com/photo.jpg',
      videoUrl: 'https://example.com/video.mp4',
      passportUrl: 'https://example.com/passport.pdf',
      medicalUrl: 'https://example.com/medical.pdf',
      goodConductUrl: 'https://example.com/conduct.pdf',
      uniqueCode: 'CAND-2026-1234',
      password: '$2b$10$existing-hash',
      documents: {},
      skills: [],
      languages: [],
      isVerified: false,
      status: 'in_process',
      paymentStatus: 'Paid',
      save: jest.fn(async () => {}),
      toObject() {
        return { ...this };
      },
    };
    Candidate.findOne.mockResolvedValueOnce(existingCandidate);

    const res = await request(app)
      .post('/api/register')
      .send({
        fullName: 'Existing User',
        email: 'existing@test.com',
        phone: '254700000002',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.uniqueCode).toBe('CAND-2026-1234');
    expect(res.body.password).toMatch(/^BLISS\d{4}$/);
    expect(existingCandidate.password).not.toBe('$2b$10$existing-hash');
    await expect(bcrypt.compare(res.body.password, existingCandidate.password))
      .resolves.toBe(true);
  });

  it('does not issue portal credentials until the required documents are present', async () => {
    const paymentCandidate = {
      candidateId: 'pending-documents-candidate',
      phone: '254700000008',
      uniqueCode: undefined,
      password: undefined,
      documents: {},
      save: jest.fn(async () => {}),
      toObject() {
        return { ...this };
      },
    };
    Candidate.findOne.mockResolvedValueOnce(paymentCandidate);

    const res = await request(app)
      .post('/api/register')
      .send({
        candidateId: paymentCandidate.candidateId,
        phone: paymentCandidate.phone,
        passportUrl: 'https://example.com/passport.pdf',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('photoUrl is required');
    expect(paymentCandidate.uniqueCode).toBeUndefined();
    expect(paymentCandidate.password).toBeUndefined();
    expect(paymentCandidate.save).not.toHaveBeenCalled();
  });

  it('creates portal credentials when an existing payment candidate registers', async () => {
    const paymentCandidate = {
      _id: 'payment_candidate_123',
      candidateId: 'payment_candidate_123',
      fullName: 'Payment Candidate',
      phone: '254700000007',
      uniqueCode: undefined,
      password: undefined,
      documents: {},
      skills: [],
      languages: [],
      isVerified: false,
      status: 'in_process',
      paymentStatus: 'Paid',
      save: jest.fn(async () => {}),
      toObject() {
        return { ...this };
      },
    };
    Candidate.findOne.mockResolvedValueOnce(paymentCandidate);

    const res = await request(app)
      .post('/api/register')
      .send({
        candidateId: paymentCandidate.candidateId,
        phone: paymentCandidate.phone,
        photoUrl: 'https://example.com/photo.jpg',
        videoUrl: 'https://example.com/video.mp4',
        passportUrl: 'https://example.com/passport.pdf',
        medicalUrl: 'https://example.com/medical.pdf',
        conductUrl: 'https://example.com/conduct.pdf',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.uniqueCode).toMatch(/^CAND-\d{4}-\d{4}$/);
    expect(res.body.password).toMatch(/^BLISS\d{4}$/);
    expect(paymentCandidate.candidateId).toBe('payment_candidate_123');
    expect(paymentCandidate.uniqueCode).toBe(res.body.uniqueCode);
    expect(paymentCandidate.password).not.toBe(res.body.password);
  });

  it('should register an existing candidate using saved contact details', async () => {
    const existingCandidate = {
      _id: 'cand_saved_details',
      fullName: 'Saved Candidate',
      email: 'saved@example.com',
      phone: '254700000003',
      uniqueCode: 'CAND-2026-5678',
      password: '$2b$10$existing-hash',
      documents: {},
      skills: [],
      languages: [],
      isVerified: false,
      status: 'in_process',
      paymentStatus: 'Paid',
      save: jest.fn(async () => {}),
      toObject() {
        return { ...this };
      },
    };
    Candidate.findOne.mockResolvedValueOnce(existingCandidate);

    const res = await request(app)
      .post('/api/register')
      .send({
        candidateId: 'CAND-2026-5678',
        photoUrl: 'https://example.com/photo.jpg',
        videoUrl: 'https://example.com/video.mp4',
        passportUrl: 'https://example.com/passport.pdf',
        medicalUrl: 'https://example.com/medical.pdf',
        conductUrl: 'https://example.com/conduct.pdf',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.uniqueCode).toBe('CAND-2026-5678');
    expect(res.body.password).toMatch(/^BLISS\d{4}$/);
    expect(existingCandidate.email).toBe('saved@example.com');
    expect(existingCandidate.phone).toBe('254700000003');
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [
        { candidateId: 'CAND-2026-5678' },
        { uniqueCode: 'CAND-2026-5678' },
      ],
    });
  });

  it('restores a real stored name when the full name is a generic placeholder', async () => {
    const existingCandidate = {
      _id: 'candidate-with-name-placeholder',
      candidateId: 'candidate-with-name-placeholder',
      fullName: 'Candidate',
      name: 'Amina Wanjiku',
      email: 'amina@example.com',
      phone: '254700000009',
      photoUrl: 'https://example.com/photo.jpg',
      videoUrl: 'https://example.com/video.mp4',
      passportUrl: 'https://example.com/passport.pdf',
      medicalUrl: 'https://example.com/medical.pdf',
      goodConductUrl: 'https://example.com/conduct.pdf',
      uniqueCode: 'CAND-2026-7777',
      documents: {},
      skills: [],
      languages: [],
      isVerified: false,
      status: 'in_process',
      paymentStatus: 'Paid',
      save: jest.fn(async () => {}),
      toObject() {
        return { ...this };
      },
    };
    Candidate.findOne.mockResolvedValueOnce(existingCandidate);

    const response = await request(app)
      .post('/api/register')
      .send({
        candidateId: 'candidate-with-name-placeholder',
        photoUrl: existingCandidate.photoUrl,
        videoUrl: existingCandidate.videoUrl,
        passportUrl: existingCandidate.passportUrl,
        medicalUrl: existingCandidate.medicalUrl,
        conductUrl: existingCandidate.goodConductUrl,
      });

    expect(response.statusCode).toBe(201);
    expect(existingCandidate.fullName).toBe('Amina Wanjiku');
    expect(existingCandidate.name).toBe('Amina Wanjiku');
  });

  it('should register a candidate with a phone number and no email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        fullName: 'Candidate Without Email',
        phone: '254700000006',
        photoUrl: 'https://example.com/photo.jpg',
        videoUrl: 'https://example.com/video.mp4',
        passportUrl: 'https://example.com/passport.pdf',
        medicalUrl: 'https://example.com/medical.pdf',
        conductUrl: 'https://example.com/conduct.pdf',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.uniqueCode).toBeDefined();
    expect(res.body.password).toMatch(/^BLISS\d{4}$/);
    expect(Candidate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Candidate Without Email',
        phone: '254700000006',
      }),
    );
  });

  it('should issue credentials for a saved candidate without an email', async () => {
    const mongoId = '507f1f77bcf86cd799439011';
    const existingCandidate = {
      _id: mongoId,
      fullName: 'Candidate Without Email',
      phone: '254700000004',
      uniqueCode: 'CAND-2026-6789',
      password: '$2b$10$existing-hash',
      documents: {},
      skills: ['Caregiving'],
      languages: ['English'],
      isVerified: false,
      status: 'in_process',
      paymentStatus: 'Paid',
      save: jest.fn(async () => {}),
      toObject() {
        return { ...this };
      },
    };
    Candidate.findOne.mockResolvedValueOnce(existingCandidate);

    const res = await request(app)
      .post('/api/register')
      .send({
        candidateId: mongoId,
        photoUrl: 'https://example.com/photo.jpg',
        videoUrl: 'https://example.com/video.mp4',
        passportUrl: 'https://example.com/passport.pdf',
        medicalUrl: 'https://example.com/medical.pdf',
        skills: [],
        languages: [],
        applicationType: 'International',
        isInternational: true,
        nationalIdFrontUrl: 'https://example.com/id-front.jpg',
        nationalIdBackUrl: 'https://example.com/id-back.jpg',
        goodConductUrl: 'https://example.com/conduct.pdf',
        otherDocumentUrl: 'https://example.com/other.pdf',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.uniqueCode).toBe('CAND-2026-6789');
    expect(res.body.password).toMatch(/^BLISS\d{4}$/);
    expect(existingCandidate.skills).toEqual(['Caregiving']);
    expect(existingCandidate.languages).toEqual(['English']);
    expect(existingCandidate.applicationType).toBe('International');
    expect(existingCandidate.isInternational).toBe(true);
    expect(existingCandidate.nationalIdFrontUrl)
      .toBe('https://example.com/id-front.jpg');
    expect(existingCandidate.nationalIdBackUrl)
      .toBe('https://example.com/id-back.jpg');
    expect(existingCandidate.goodConductUrl)
      .toBe('https://example.com/conduct.pdf');
    expect(existingCandidate.otherDocumentUrl)
      .toBe('https://example.com/other.pdf');
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [
        { _id: mongoId },
        { candidateId: mongoId },
        { uniqueCode: mongoId },
      ],
    });
  });
});
