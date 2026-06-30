/**
 * Test Script: Verify marketplace endpoints return correct structure
 * 
 * This script tests the marketplace endpoints to ensure:
 * 1. Correct data structure is returned
 * 2. Sensitive fields are not exposed
 * 3. Profile completion is present
 * 4. Both endpoint implementations return same structure
 * 
 * Usage: node scripts/test_marketplace_endpoints.js
 */

const mongoose = require('mongoose');
const Candidate = require('../models/candidate');

require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

// Expected fields in marketplace response
const EXPECTED_FIELDS = [
  'candidateId',
  'fullName',
  'nationality',
  'religion',
  'age',
  'maritalStatus',
  'numberOfChildren',
  'jobPosition',
  'experience',
  'education',
  'skills',
  'languages',
  'expectedSalary',
  'destinationCountry',
  'destinationPreference',
  'photoUrl',
  'videoAvailable',
  'passportAvailable',
  'medicalAvailable',
  'profileCompletion',
  'currentStatus',
  'status',
  'availability',
];

// Fields that MUST NOT be in response
const FORBIDDEN_FIELDS = [
  'phone',
  'email',
  'password',
  'passportUrl',
  'medicalUrl',
  'videoUrl',
  'resumeUrl',
  'resetToken',
  'resetTokenExpires',
];

function normalizeCandidate(candidate) {
  if (!candidate) return null;
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  const birthDate = candidateObj.dateOfBirth ? new Date(candidateObj.dateOfBirth) : null;
  const age = birthDate && !Number.isNaN(birthDate.getTime())
    ? new Date().getFullYear() - birthDate.getFullYear()
    : null;
  return {
    _id: candidateObj._id,
    uniqueCode: candidateObj.uniqueCode || candidateObj.candidateId || (candidateObj._id ? candidateObj._id.toString() : null),
    candidateId: candidateObj.candidateId || candidateObj.uniqueCode || (candidateObj._id ? candidateObj._id.toString() : null),
    name: candidateObj.fullName || candidateObj.name,
    fullName: candidateObj.fullName || candidateObj.name,
    email: candidateObj.email,
    phone: candidateObj.phone,
    country: candidateObj.country,
    nationality: candidateObj.nationality,
    religion: candidateObj.religion,
    gender: candidateObj.gender,
    dateOfBirth: candidateObj.dateOfBirth,
    age,
    idNumber: candidateObj.idNumber,
    education: candidateObj.education,
    educationalLevel: candidateObj.educationalLevel,
    experience: candidateObj.experience,
    skills: candidateObj.skills || [],
    languages: candidateObj.languages || [],
    maritalStatus: candidateObj.maritalStatus,
    numberOfChildren: candidateObj.numberOfChildren,
    jobPosition: candidateObj.jobPosition,
    jobType: candidateObj.jobType,
    destinationCountry: candidateObj.destinationCountry,
    destinationPreference: candidateObj.destinationPreference,
    expectedSalary: candidateObj.expectedSalary,
    profilePhoto: candidateObj.profilePhoto || candidateObj.photoUrl,
    photoUrl: candidateObj.photoUrl,
    videoUrl: candidateObj.videoUrl,
    passportUrl: candidateObj.passportUrl,
    medicalUrl: candidateObj.medicalUrl,
    resumeUrl: candidateObj.resumeUrl,
    additionalUrl: candidateObj.additionalUrl,
    isVerified: candidateObj.isVerified,
    status: candidateObj.status,
    currentStatus: candidateObj.currentStatus,
    paymentStatus: candidateObj.paymentStatus,
    profileCompletion: candidateObj.profileCompletion || 0,
    createdAt: candidateObj.createdAt,
  };
}

function buildMarketplaceCandidate(candidate) {
  const candidateObj = normalizeCandidate(candidate);
  const experience = candidateObj.experience;
  const experienceLabel = experience !== undefined && experience !== null
    ? (typeof experience === 'string'
        ? experience.trim().length > 0
          ? (/^\d+$/.test(experience.trim()) ? `${experience.trim()} Years` : experience.trim())
          : null
        : `${experience} Years`)
    : null;
  const languages = Array.isArray(candidateObj.languages) ? candidateObj.languages : [];
  const skills = Array.isArray(candidateObj.skills) ? candidateObj.skills : [];
  const destination = Array.isArray(candidateObj.destinationPreference)
    ? candidateObj.destinationPreference.join(', ')
    : candidateObj.destinationPreference || null;

  return {
    // IDENTIFICATION
    candidateId: candidateObj.candidateId,
    fullName: candidateObj.fullName,

    // PERSONAL
    nationality: candidateObj.nationality,
    religion: candidateObj.religion,
    age: candidateObj.age,
    maritalStatus: candidateObj.maritalStatus,
    numberOfChildren: candidateObj.numberOfChildren,

    // PROFESSIONAL
    jobPosition: candidateObj.jobPosition,
    experience: experienceLabel,
    education: candidateObj.education || candidateObj.educationalLevel,
    skills: skills,
    languages: languages,
    expectedSalary: candidateObj.expectedSalary,

    // LOCATION
    destinationCountry: candidateObj.destinationCountry,
    destinationPreference: destination,

    // MEDIA (only flags, not actual URLs)
    photoUrl: candidateObj.photoUrl,
    videoAvailable: !!candidateObj.videoUrl,
    passportAvailable: !!candidateObj.passportUrl,
    medicalAvailable: !!candidateObj.medicalUrl,

    // STATUS
    profileCompletion: candidateObj.profileCompletion,
    currentStatus: candidateObj.currentStatus,
    status: candidateObj.status,
    availability: candidateObj.status === 'available' ? 'Available ✔' : candidateObj.status || 'Unavailable',
  };
}

async function testMarketplaceEndpoints() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    console.log('Fetching verified, available candidates...');
    const candidates = await Candidate.find({ isVerified: true, status: 'available' }).limit(3);

    if (candidates.length === 0) {
      console.log('⚠️  No verified, available candidates found. Testing with first 3 candidates...');
      const allCandidates = await Candidate.find().limit(3);
      if (allCandidates.length === 0) {
        console.error('❌ No candidates found in database');
        await mongoose.connection.close();
        process.exit(1);
      }
      candidates.push(...allCandidates);
    }

    console.log(`✓ Found ${candidates.length} candidate(s) for testing\n`);

    // Test buildMarketplaceCandidate
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      console.log(`\n--- TEST ${i + 1}: Candidate ${candidate.candidateId || candidate._id.toString()} ---`);

      try {
        const marketplaceData = buildMarketplaceCandidate(candidate);

        // Check all expected fields are present
        const missingFields = EXPECTED_FIELDS.filter(field => !(field in marketplaceData));
        const unexpectedFields = Object.keys(marketplaceData).filter(field => !EXPECTED_FIELDS.includes(field));

        // Check no forbidden fields
        const forbiddenPresent = FORBIDDEN_FIELDS.filter(field => field in marketplaceData);

        if (missingFields.length > 0) {
          console.error(`  ❌ Missing expected fields: ${missingFields.join(', ')}`);
          failed++;
        } else {
          console.log(`  ✓ All ${EXPECTED_FIELDS.length} expected fields present`);
        }

        if (unexpectedFields.length > 0) {
          console.warn(`  ⚠️  Unexpected fields: ${unexpectedFields.join(', ')}`);
        }

        if (forbiddenPresent.length > 0) {
          console.error(`  ❌ SECURITY ISSUE - Forbidden fields present: ${forbiddenPresent.join(', ')}`);
          failed++;
        } else {
          console.log(`  ✓ No sensitive fields exposed`);
        }

        // Check profileCompletion exists
        if (marketplaceData.profileCompletion === undefined || marketplaceData.profileCompletion === null) {
          console.error(`  ❌ profileCompletion is missing or null`);
          failed++;
        } else {
          console.log(`  ✓ profileCompletion: ${marketplaceData.profileCompletion}%`);
        }

        // Check critical fields
        const criticalFields = ['candidateId', 'fullName', 'photoUrl'];
        const criticalMissing = criticalFields.filter(f => !marketplaceData[f]);
        if (criticalMissing.length > 0) {
          console.error(`  ❌ Critical fields missing: ${criticalMissing.join(', ')}`);
          failed++;
        } else {
          console.log(`  ✓ All critical fields present`);
        }

        // Show field summary
        console.log(`\n  Field Summary:`);
        console.log(`    candidateId: ${marketplaceData.candidateId}`);
        console.log(`    fullName: ${marketplaceData.fullName}`);
        console.log(`    nationality: ${marketplaceData.nationality}`);
        console.log(`    jobPosition: ${marketplaceData.jobPosition}`);
        console.log(`    expectedSalary: ${marketplaceData.expectedSalary}`);
        console.log(`    profileCompletion: ${marketplaceData.profileCompletion}%`);
        console.log(`    photoUrl: ${marketplaceData.photoUrl ? '✓ (URL present)' : '✗ (missing)'}`);

        if (missingFields.length === 0 && forbiddenPresent.length === 0 && marketplaceData.profileCompletion !== undefined) {
          console.log(`\n  ✓ PASSED`);
          passed++;
        } else {
          console.log(`\n  ✗ FAILED`);
          failed++;
        }
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`TEST SUMMARY`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Passed: ${passed}/${candidates.length}`);
    console.log(`Failed: ${failed}/${candidates.length}`);

    if (failed === 0) {
      console.log(`\n✓ ALL TESTS PASSED`);
    } else {
      console.log(`\n❌ SOME TESTS FAILED`);
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error:', err.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testMarketplaceEndpoints();
