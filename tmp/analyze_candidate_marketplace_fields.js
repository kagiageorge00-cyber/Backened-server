const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Candidate = require('../models/candidate');

dotenv.config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

const requiredFields = [
  'photoUrl',
  'nationality',
  'religion',
  'education',
  'experience',
  'skills',
  'languages',
  'dateOfBirth',
  'jobPosition',
  'expectedSalary',
  'destinationCountry',
];

function isMissing(value) {
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'string') return value.trim().length === 0;
  return value === undefined || value === null || value === '';
}

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const docs = await Candidate.find({}).lean();

    const report = docs.map((candidate) => {
      const missing = requiredFields.filter((field) => isMissing(candidate[field]));
      return {
        id: candidate.uniqueCode || candidate.candidateId || String(candidate._id),
        fullName: candidate.fullName || candidate.name || 'N/A',
        status: candidate.status || 'unknown',
        isVerified: candidate.isVerified,
        missing,
      };
    });

    console.log(JSON.stringify({ totalCandidates: docs.length, requiredFields, candidates: report }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
