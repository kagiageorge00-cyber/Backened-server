const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Candidate = require('../models/candidate');
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const result = await Candidate.updateOne(
      { uniqueCode: 'CAND-2026-3741' },
      { $set: { fullName: 'Esther Lorna Kombo', name: 'Esther Lorna Kombo' } }
    );
    console.log(JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
