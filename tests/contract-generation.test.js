jest.mock('../models/Contract', () =>
  jest.fn().mockImplementation((fields) => ({
    ...fields,
    toObject() {
      return { ...this };
    },
    save: jest.fn().mockResolvedValue(true),
  }))
);

jest.mock('../models/Deployment', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/ActivityLog', () => ({
  create: jest.fn().mockResolvedValue({}),
}));

jest.mock('../middleware/audit', () => ({}));

jest.mock('../middleware/employerAuth', () => jest.fn((req, res, next) => {
  req.employer = {
    employerId: 'EMP-TEST',
    companyName: 'Test Employer',
    status: 'active',
    verificationStatus: 'verified_employer',
  };
  next();
}));

jest.mock('../utils/notificationHelper', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');
const Contract = require('../models/Contract');
const Deployment = require('../models/Deployment');
const Candidate = require('../models/candidate');
const contractsRouter = require('../routes/contracts');

const app = express();
app.use(express.json());
app.use('/api/contracts', contractsRouter);

describe('contract generation', () => {
  let generatedFilePath;

  afterEach(() => {
    if (generatedFilePath && fs.existsSync(generatedFilePath)) {
      fs.unlinkSync(generatedFilePath);
    }
    generatedFilePath = null;
    jest.clearAllMocks();
  });

  test('returns a contract only after its PDF has been written', async () => {
    const deployment = {
      deploymentId: 'DEP-TEST',
      employerId: 'EMP-TEST',
      candidateId: 'CAN-TEST',
      jobPosition: 'Caregiver',
      candidateCountry: 'Kenya',
      save: jest.fn().mockResolvedValue(true),
    };
    Deployment.findOne.mockResolvedValue(deployment);
    Candidate.findOne.mockResolvedValue({
      _id: { toString: () => 'candidate-object-id' },
      firstName: 'Test',
      lastName: 'Candidate',
    });

    const response = await request(app)
      .post('/api/contracts/generate')
      .send({
        deploymentId: 'DEP-TEST',
        companyName: 'Test Employer',
        jobDescription: 'Caregiver',
        salary: 1500,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.contract.contractUrl).toMatch(
      /^\/uploads\/contracts\/.+\.pdf$/
    );
    generatedFilePath = path.join(
      __dirname,
      '..',
      'uploads',
      'contracts',
      path.basename(response.body.contract.contractUrl)
    );
    expect(fs.existsSync(generatedFilePath)).toBe(true);
    const pdf = fs.readFileSync(generatedFilePath);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const pdfContents = pdf.toString('latin1');
    expect(pdfContents).toContain('/Subtype /Image');
    expect(pdfContents).toContain('/ca 0.16');
    expect(Contract).toHaveBeenCalled();
    expect(deployment.save).toHaveBeenCalled();
  });
});
