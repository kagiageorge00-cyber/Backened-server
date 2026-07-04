const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Candidate = require('../models/candidate');
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const docs = await Candidate.find({
      uniqueCode: { $in: ['CAND-2026-7247', 'CAND-2026-3431', 'CAND-2026-2865', 'CAND-2026-2682', 'CAND-2026-2325', 'CAND-2026-3741'] },
    }).lean();
    console.log(JSON.stringify(docs.map((d) => ({
      uniqueCode: d.uniqueCode,
      fullName: d.fullName,
      nationality: d.nationality,
      religion: d.religion,
      education: d.education,
      experience: d.experience,
      dateOfBirth: d.dateOfBirth,
      jobPosition: d.jobPosition,
      expectedSalary: d.expectedSalary,
      destinationCountry: d.destinationCountry,
    })), null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
