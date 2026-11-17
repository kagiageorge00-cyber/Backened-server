jest.mock('../models/candidate', () => ({
  collection: {
    indexes: jest.fn(),
    dropIndex: jest.fn(),
    createIndex: jest.fn(),
  },
  schema: {
    indexes: jest.fn(() => [
      [{ phone: 1 }, { unique: true, _autoIndex: false }],
      [
        { uniqueCode: 1 },
        {
          unique: true,
          partialFilterExpression: { uniqueCode: { $type: 'string' } },
        },
      ],
    ]),
  },
}));

const Candidate = require('../models/candidate');
const { initializeCandidateIndexes } = require('../services/candidateIndexes');

describe('Candidate database indexes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('replaces the old required uniqueCode index so drafts can omit portal codes', async () => {
    Candidate.collection.indexes.mockResolvedValue([
      { name: '_id_', key: { _id: 1 } },
      { name: 'uniqueCode_1', key: { uniqueCode: 1 }, unique: true },
    ]);

    await initializeCandidateIndexes();

    expect(Candidate.collection.dropIndex).toHaveBeenCalledWith('uniqueCode_1');
    expect(Candidate.collection.createIndex).toHaveBeenCalledWith(
      { uniqueCode: 1 },
      expect.objectContaining({
        unique: true,
        partialFilterExpression: { uniqueCode: { $type: 'string' } },
      }),
    );
    expect(Candidate.collection.createIndex).toHaveBeenCalledWith(
      { phone: 1 },
      { unique: true },
    );
    expect(Candidate.collection.createIndex).toHaveBeenCalledTimes(2);
  });

  test('keeps an existing partial uniqueCode index', async () => {
    Candidate.collection.indexes.mockResolvedValue([
      {
        name: 'uniqueCode_1',
        key: { uniqueCode: 1 },
        unique: true,
        partialFilterExpression: { uniqueCode: { $type: 'string' } },
      },
    ]);

    await initializeCandidateIndexes();

    expect(Candidate.collection.dropIndex).not.toHaveBeenCalled();
    expect(Candidate.collection.createIndex).toHaveBeenCalledTimes(2);
  });
});
