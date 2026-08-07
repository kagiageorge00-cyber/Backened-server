require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('../models/candidate');

(async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';
    await mongoose.connect(uri);
    const candidates = await Candidate.find({ status: 'available' }).limit(5).lean();
    console.log(JSON.stringify(candidates.map((c) => ({
      id: c._id?.toString?.() || c._id,
      code: c.candidateId || c.uniqueCode,
      name: c.fullName || c.name,
      videoUrl: c.videoUrl,
      introductionVideoUrl: c.introductionVideoUrl,
      photoUrl: c.photoUrl,
      skills: c.skills,
      languages: c.languages,
      education: c.education,
      experience: c.experience,
      professionalSummary: c.professionalSummary,
      careerObjective: c.careerObjective,
      jobPosition: c.jobPosition,
      destinationCountry: c.destinationCountry,
      expectedSalary: c.expectedSalary,
      isVerified: c.isVerified,
    })), null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
