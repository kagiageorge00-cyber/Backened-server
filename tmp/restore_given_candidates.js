require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Candidate = require('../models/candidate');

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

const records = [
  {
    uniqueCode: 'CAND-2026-2865',
    fullName: 'VIVIAN NECHESA ANYIKA',
    password: 'BLISS9288',
    phone: '+254700000001',
    email: 'vivian.2865@bliss.local',
  },
  {
    uniqueCode: 'CAND-2026-2682',
    fullName: 'VALENTINE AUMA SIDUWA',
    password: 'BLISS6652',
    phone: '+254700000002',
    email: 'valentine.2682@bliss.local',
  },
  {
    uniqueCode: 'CAND-2026-3431',
    fullName: 'JACKLINE MAKENA MUTUMA',
    password: 'BLISS1038',
    phone: '+254700000003',
    email: 'jackline.3431@bliss.local',
  },
  {
    uniqueCode: 'CAND-2026-3741',
    fullName: 'ESTHER LORNA KOMBO',
    password: 'BLISS6990',
    phone: '+254700000004',
    email: 'esther.3741@bliss.local',
  },
  {
    uniqueCode: 'CAND-2026-7885',
    fullName: 'ELIZABETH MAKUNGU KAMADI',
    password: 'BLISS9053',
    phone: '+254700000005',
    email: 'elizabeth.7885@bliss.local',
  },
  {
    uniqueCode: 'CAND-2026-2325',
    fullName: 'WINNIE NYANGWESO KUBATI',
    password: 'BLISS5022',
    phone: '+254700000006',
    email: 'winnie.2325@bliss.local',
  },
];

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

    const results = [];

    for (const record of records) {
      const payload = {
        uniqueCode: record.uniqueCode,
        candidateId: record.uniqueCode,
        fullName: record.fullName,
        name: record.fullName,
        password: await bcrypt.hash(record.password, 10),
        phone: record.phone,
        email: record.email,
        country: 'Kenya',
        nationality: 'Kenyan',
        status: 'available',
        currentStatus: 'Registration',
        applicationStatus: 'Pending Payment',
        paymentStatus: 'Pending',
        isVerified: false,
        profileCompletion: 0,
        createdAt: new Date(),
      };

      const doc = await Candidate.findOneAndUpdate(
        { uniqueCode: record.uniqueCode },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );

      const passwordMatch = await bcrypt.compare(record.password, doc.password || '');
      results.push({
        uniqueCode: doc.uniqueCode,
        fullName: doc.fullName,
        passwordMatch,
        phone: doc.phone,
        email: doc.email,
        status: doc.status,
      });
    }

    console.log(JSON.stringify(results, null, 2));
    console.log('RESTORE_COMPLETE');
    await mongoose.disconnect();
  } catch (err) {
    console.error('DB_ERROR', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
