jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
    },
  },
}));

jest.mock('multer-storage-cloudinary', () => ({
  CloudinaryStorage: class CloudinaryStorage {
    constructor() {}
  },
}));

jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
}));

const Candidate = require('../models/candidate');
const { persistUploadToCandidate } = require('../routes/upload');

describe('upload persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('persists uploaded medical documents into the candidate record', async () => {
    const candidate = {
      documents: { uploads: [] },
      save: jest.fn().mockResolvedValue({}),
    };
    Candidate.findOne.mockResolvedValue(candidate);

    await persistUploadToCandidate({
      candidateId: 'CAND-2026-0001',
      field: 'medical',
      fileUrl: 'https://cdn.example.com/medical.pdf',
    });

    expect(Candidate.findOne).toHaveBeenCalled();
    expect(candidate.medicalUrl).toBe('https://cdn.example.com/medical.pdf');
    expect(candidate.save).toHaveBeenCalled();
  });
});
