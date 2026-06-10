/**
 * Seed test credentials for boss user
 * Run with: node scripts/seed_boss_credentials.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Candidate = require('../models/candidate');
const Employer = require('../models/Employer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

async function seedCredentials() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('boss123', 10);

    // Create test candidate
    console.log('\nCreating test candidate...');
    try {
      const existingCandidate = await Candidate.findOne({ uniqueCode: 'boss' });
      if (existingCandidate) {
        console.log('Candidate with ID "boss" already exists. Updating password...');
        existingCandidate.password = hashedPassword;
        await existingCandidate.save();
        console.log('✅ Candidate password updated');
      } else {
        const candidate = new Candidate({
          uniqueCode: 'boss',
          password: hashedPassword,
          name: 'Boss User',
          fullName: 'Boss User',
          email: 'boss.candidate@bliss.com',
          phone: '+254700000001',
          country: 'Kenya',
          status: 'available',
          isVerified: true,
        });
        await candidate.save();
        console.log('✅ Candidate created: ID = "boss", Password = "boss123"');
      }
    } catch (err) {
      console.error('❌ Error with candidate:', err.message);
    }

    // Create test employer
    console.log('\nCreating test employer...');
    try {
      const existingEmployer = await Employer.findOne({
        $or: [{ email: 'boss@boss.com' }, { employerId: 'boss' }],
      });
      if (existingEmployer) {
        console.log('Employer "boss" already exists. Updating password...');
        existingEmployer.password = hashedPassword;
        await existingEmployer.save();
        console.log('✅ Employer password updated');
      } else {
        const employer = new Employer({
          employerId: 'boss',
          companyName: 'Boss Company',
          contactPerson: 'Boss User',
          email: 'boss@boss.com',
          phone: '+254700000002',
          country: 'Kenya',
          password: hashedPassword,
          status: 'active',
        });
        await employer.save();
        console.log('✅ Employer created: Email = "boss@boss.com", Password = "boss123"');
      }
    } catch (err) {
      console.error('❌ Error with employer:', err.message);
    }

    console.log('\n✅ Seeding complete!');
    console.log('\nTest Credentials:');
    console.log('─────────────────────────────────────');
    console.log('CANDIDATE PORTAL:');
    console.log('  ID: boss');
    console.log('  Password: boss123');
    console.log('─────────────────────────────────────');
    console.log('EMPLOYER PORTAL:');
    console.log('  Email: boss@boss.com');
    console.log('  Password: boss123');
    console.log('─────────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedCredentials();
