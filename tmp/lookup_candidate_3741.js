const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Candidate = require('../models/candidate');
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    const c = await Candidate.findOne({ uniqueCode: 'CAND-2026-3741' }).lean();
    const payment = await db.collection('payments').findOne({
      $or: [
        { userId: c?.phone },
        { userId: c?.email },
        { 'metadata.email': c?.email },
        { 'metadata.phone': c?.phone },
      ],
    });
    console.log(JSON.stringify({
      candidate: {
        uniqueCode: c?.uniqueCode,
        phone: c?.phone,
        email: c?.email,
        currentName: c?.fullName,
      },
      payment,
    }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
