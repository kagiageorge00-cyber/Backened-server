/**
 * Migration Script: Normalize candidate marketplace data and backfill profileCompletion.
 *
 * Usage:
 *   MONGO_URI="mongodb://..." node scripts/backfill_profile_completion.js
 *
 * What it does:
 * - Normalizes skills/languages/destinationPreference to arrays
 * - Sets candidateId / uniqueCode / fullName / name defaults
 * - Copies profilePhoto into photoUrl if photoUrl is missing
 * - Recalculates profileCompletion for every candidate
 * - Provides a summary of changed candidates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('../models/candidate');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

function normalizeArrayField(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function calculateProfileCompletion(candidate) {
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

  const completedFields = requiredForMarketplace.filter((field) => {
    const value = candidate[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value != null && value !== '';
  });

  return Math.round((completedFields.length / requiredForMarketplace.length) * 100);
}

function safeString(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function needsUpdate(existing, normalized) {
  if (existing === undefined && normalized !== undefined) return true;
  if (existing === null && normalized !== null) return true;
  if (Array.isArray(existing) && Array.isArray(normalized)) {
    const a = existing.map((item) => String(item || '').trim());
    const b = normalized.map((item) => String(item || '').trim());
    if (a.length !== b.length) return true;
    return a.some((value, idx) => value !== b[idx]);
  }
  return existing !== normalized;
}

async function run() {
  try {
    const uri = MONGODB_URI;
    console.log('Connecting to MongoDB...', uri);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');

    const cursor = Candidate.find().lean().cursor();
    let total = 0;
    let updated = 0;
    let errors = 0;

    for await (const candidate of cursor) {
      total++;
      const update = {};

      const normalizedSkills = normalizeArrayField(candidate.skills);
      const normalizedLanguages = normalizeArrayField(candidate.languages);
      const normalizedDestinationPreference = normalizeArrayField(candidate.destinationPreference);

      if (needsUpdate(candidate.skills, normalizedSkills)) {
        update.skills = normalizedSkills;
      }
      if (needsUpdate(candidate.languages, normalizedLanguages)) {
        update.languages = normalizedLanguages;
      }
      if (needsUpdate(candidate.destinationPreference, normalizedDestinationPreference)) {
        update.destinationPreference = normalizedDestinationPreference;
      }

      const candidateId = safeString(candidate.candidateId) || safeString(candidate.uniqueCode) || String(candidate._id);
      if (!safeString(candidate.candidateId) && candidateId) {
        update.candidateId = candidateId;
      }

      const uniqueCode = safeString(candidate.uniqueCode) || candidateId;
      if (!safeString(candidate.uniqueCode) && uniqueCode) {
        update.uniqueCode = uniqueCode;
      }

      if (!safeString(candidate.fullName) && safeString(candidate.name)) {
        update.fullName = candidate.name;
      }
      if (!safeString(candidate.name) && safeString(candidate.fullName)) {
        update.name = candidate.fullName;
      }

      if (!safeString(candidate.photoUrl) && safeString(candidate.profilePhoto)) {
        update.photoUrl = candidate.profilePhoto;
      }

      if (!safeString(candidate.status)) {
        update.status = 'in_process';
      }

      if (!safeString(candidate.currentStatus)) {
        update.currentStatus = 'Registration';
      }

      const normalizedCandidate = {
        ...candidate,
        ...update,
      };

      const newProfileCompletion = calculateProfileCompletion(normalizedCandidate);
      if (needsUpdate(candidate.profileCompletion, newProfileCompletion)) {
        update.profileCompletion = newProfileCompletion;
      }

      if (Object.keys(update).length > 0) {
        try {
          await Candidate.updateOne({ _id: candidate._id }, { $set: update });
          updated++;
          if (updated <= 10) {
            console.log(`Updated candidate ${candidateId}:`, update);
          }
        } catch (err) {
          errors++;
          console.error(`  Failed to update ${candidateId}:`, err.message);
        }
      }

      if (total % 200 === 0) {
        console.log(`  Processed ${total} candidates... updated ${updated}, errors ${errors}`);
      }
    }

    const stats = await Candidate.aggregate([
      {
        $group: {
          _id: null,
          totalCandidates: { $sum: 1 },
          avgCompletion: { $avg: '$profileCompletion' },
          maxCompletion: { $max: '$profileCompletion' },
          minCompletion: { $min: '$profileCompletion' },
        },
      },
    ]);

    console.log('\nMigration complete');
    console.log(`  Total candidates processed: ${total}`);
    console.log(`  Documents updated: ${updated}`);
    console.log(`  Errors: ${errors}`);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log('Profile completion stats:');
      console.log(`  Average: ${Math.round(stat.avgCompletion)}%`);
      console.log(`  Minimum: ${stat.minCompletion}%`);
      console.log(`  Maximum: ${stat.maxCompletion}%`);
    }

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

run();
