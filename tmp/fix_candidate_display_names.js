const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Candidate = require('../models/candidate');

dotenv.config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

const genericValues = new Set(['candidate', 'candidate ', 'n/a', 'na', '']);

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function pickReplacement(candidate) {
  const candidates = [candidate.phone, candidate.email, candidate.uniqueCode, candidate.candidateId, candidate._id];
  for (const value of candidates) {
    const normalized = normalize(value);
    if (normalized && !genericValues.has(normalized.toLowerCase())) {
      return normalized;
    }
  }
  return normalize(candidate.fullName || candidate.name) || 'Candidate';
}

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const docs = await Candidate.find({}).lean();
    let updated = 0;

    for (const doc of docs) {
      const currentName = normalize(doc.fullName || doc.name);
      const isGeneric = !currentName || genericValues.has(currentName.toLowerCase());
      if (isGeneric) {
        const replacement = pickReplacement(doc);
        await Candidate.updateOne({ _id: doc._id }, { $set: { fullName: replacement, name: replacement } });
        updated += 1;
        console.log(`UPDATED ${doc.uniqueCode || doc.candidateId || String(doc._id)} -> ${replacement}`);
      }
    }

    console.log(`UPDATED_COUNT ${updated}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
