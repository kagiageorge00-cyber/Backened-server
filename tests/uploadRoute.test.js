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
    _handleFile(req, file, cb) {
      cb(new Error('cloudinary unavailable'));
    }
  },
}));

jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
}));

const stream = require('stream');
const Candidate = require('../models/candidate');
const { persistUploadToCandidate, createAdaptiveStorage } = require('../routes/upload');

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

  test('returns the Cloudinary error when upload fails', (done) => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'demo';
    process.env.CLOUDINARY_API_SECRET = 'demo';

    const storage = createAdaptiveStorage();
    const fileStream = new stream.PassThrough();
    fileStream.end(Buffer.from('test upload content'));
    const file = {
      originalname: 'job.pdf',
      stream: fileStream,
    };
    storage._handleFile({ query: { type: 'marketplace_job' } }, file, (err, info) => {
      try {
        expect(err).toEqual(new Error('cloudinary unavailable'));
        expect(info).toBeUndefined();
        done();
      } catch (assertionError) {
        done(assertionError);
      }
    });
  });
});
