const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Candidate = require('../models/candidate');
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function looksLikeRealName(value) {
  const v = normalize(value);
  if (!v) return false;
  if (/[A-Za-z]/.test(v) === false) return false;
  if (/^\+?\d+$/.test(v)) return false;
  if (/^0\d{9,10}$/.test(v)) return false;
  if (/^254\d{9}$/.test(v)) return false;
  if (/^CAND-/i.test(v)) return false;
  return true;
}

function pickNameFromRecord(doc) {
  const candidates = [doc.fullName, doc.name, doc.email, doc.phone];
  for (const value of candidates) {
    if (looksLikeRealName(value)) return normalize(value);
  }
  return '';
}

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    const docs = await Candidate.find({}).lean();
    let updated = 0;

    for (const doc of docs) {
      const currentName = normalize(doc.fullName || doc.name);
      const existingName = pickNameFromRecord(doc);
      let recoveredName = '';

      if (!existingName) {
        const payment = await db.collection('payments').findOne({
          $or: [
            { userId: doc.phone },
            { userId: doc.email },
            { 'metadata.email': doc.email },
            { 'metadata.phone': doc.phone },
          ],
        });
        if (payment?.metadata?.name && looksLikeRealName(payment.metadata.name)) {
          recoveredName = normalize(payment.metadata.name);
        }
      } else {
        recoveredName = existingName;
      }

      if (recoveredName && recoveredName !== currentName) {
        await Candidate.updateOne({ _id: doc._id }, { $set: { fullName: recoveredName, name: recoveredName } });
        updated += 1;
        console.log('UPDATED', doc.uniqueCode || doc.candidateId || doc._id, '->', recoveredName);
      }
    }

    console.log('UPDATED_COUNT', updated);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
