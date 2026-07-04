const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Candidate = require('../models/candidate');
const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

const requiredForMarketplace = [
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

function calculateProfileCompletion(candidate) {
  const completedFields = requiredForMarketplace.filter((field) => {
    const value = candidate[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value != null && value !== '';
  });
  return Math.round((completedFields.length / requiredForMarketplace.length) * 100);
}

const updates = [
  {
    uniqueCode: 'CAND-2026-7247',
    data: {
      nationality: 'Kenyan',
      religion: 'Christian',
      education: 'Secondary',
      experience: '2 years Oman',
      dateOfBirth: '01/10/1996',
      jobPosition: 'Housemaid',
      jobAppliedFor: 'Housemaid',
      expectedSalary: '1200 AED',
      destinationCountry: 'UAE',
      destinationPreference: ['UAE'],
    },
  },
  {
    uniqueCode: 'CAND-2026-3431',
    data: {
      nationality: 'Kenyan',
      religion: 'Christian',
      education: 'Secondary',
      experience: '2 years Oman',
      dateOfBirth: '01/07/1990',
      jobPosition: 'Housemaid',
      jobAppliedFor: 'Housemaid',
      expectedSalary: '1200 AED',
      destinationCountry: 'UAE',
      destinationPreference: ['UAE'],
    },
  },
  {
    uniqueCode: 'CAND-2026-2865',
    data: {
      nationality: 'Kenyan',
      religion: 'Christian',
      education: 'Secondary',
      experience: '2 years Saudi',
      dateOfBirth: '06/06/1999',
      jobPosition: 'Housemaid',
      jobAppliedFor: 'Housemaid',
      expectedSalary: '1100 QAR',
      destinationCountry: 'Qatar',
      destinationPreference: ['Qatar'],
    },
  },
  {
    uniqueCode: 'CAND-2026-2682',
    data: {
      nationality: 'Kenyan',
      religion: 'Christian',
      education: 'Diploma',
      experience: '2 years Saudi',
      dateOfBirth: '03/08/2000',
      jobPosition: 'Housemaid',
      jobAppliedFor: 'Housemaid',
      expectedSalary: '1200 AED',
      destinationCountry: 'UAE',
      destinationPreference: ['UAE'],
    },
  },
  {
    uniqueCode: 'CAND-2026-7875',
    data: {
      nationality: 'Kenyan',
      religion: 'Christian',
      education: 'Secondary',
      experience: '2 years Kenya',
      dateOfBirth: '01/10/2000',
      jobPosition: 'Housemaid',
      jobAppliedFor: 'Housemaid',
      expectedSalary: '1000 AED',
      destinationCountry: 'UAE',
      destinationPreference: ['UAE'],
    },
  },
  {
    uniqueCode: 'CAND-2026-2325',
    data: {
      nationality: 'Kenyan',
      religion: 'Christian',
      education: 'Secondary',
      experience: '2 years Dubai',
      dateOfBirth: '22/04/1993',
      jobPosition: 'Housemaid',
      jobAppliedFor: 'Housemaid',
      expectedSalary: '1200 AED',
      destinationCountry: 'UAE',
      destinationPreference: ['UAE'],
    },
  },
  {
    uniqueCode: 'CAND-2026-3741',
    data: {
      nationality: 'Kenyan',
      religion: 'Muslim',
      education: 'Secondary',
      experience: '2 years Saudi',
      dateOfBirth: '04/04/1992',
      jobPosition: 'Housemaid',
      jobAppliedFor: 'Housemaid',
      expectedSalary: '1200 AED',
      destinationCountry: 'UAE',
      destinationPreference: ['UAE'],
    },
  },
];

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    let updated = 0;

    for (const entry of updates) {
      const candidate = await Candidate.findOne({ uniqueCode: entry.uniqueCode });
      if (!candidate) {
        console.log(`NOT_FOUND ${entry.uniqueCode}`);
        continue;
      }

      Object.assign(candidate, entry.data);
      candidate.profileCompletion = calculateProfileCompletion(candidate);
      await candidate.save();
      updated += 1;
      console.log(`UPDATED ${entry.uniqueCode}`);
    }

    console.log(`UPDATED_COUNT ${updated}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
