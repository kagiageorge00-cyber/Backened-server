const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    // Get all candidate identifiers
    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false, collection: 'candidates' }));
    const candidate = await Candidate.findOne({
      $or: [
        { uniqueCode: 'CAND-2026-3741' },
        { candidateId: 'CAND-2026-3741' },
      ]
    }).lean();

    if (!candidate) {
      console.log('❌ Candidate not found');
      process.exit(1);
    }

    console.log('📋 CANDIDATE INFO');
    console.log('================');
    console.log(`Name: ${candidate.fullName || candidate.name}`);
    console.log(`Code: ${candidate.uniqueCode || candidate.candidateId}`);
    console.log(`Phone: ${candidate.phone}`);
    console.log(`Country: ${candidate.country}`);
    console.log(`Status: ${candidate.status}`);
    console.log('');

    // Get applications
    const Application = mongoose.model('Application', new mongoose.Schema({}, { strict: false, collection: 'applications' }));
    const applications = await Application.find({
      $or: [
        { candidateId: candidate._id.toString() },
        { candidateId: candidate.uniqueCode },
        { candidateId: candidate.candidateId },
        { candidateId: candidate._id }
      ]
    }).sort({ createdAt: -1 }).lean();

    console.log(`📊 APPLICATIONS (${applications.length} found)`);
    console.log('================');

    if (applications.length === 0) {
      console.log('No applications found in database.');
      console.log('\n📋 JSON Response:');
      console.log(JSON.stringify({ success: true, data: [] }, null, 2));
    } else {
      applications.forEach((app, idx) => {
        console.log(`\n[${idx + 1}] ${app.jobTitle || 'Unknown Position'}`);
        console.log(`    Country: ${app.country || 'N/A'}`);
        console.log(`    Status: ${app.status}`);
        console.log(`    Applied: ${new Date(app.createdAt).toISOString().split('T')[0]}`);
      });

      console.log('\n\n📋 FULL JSON RESPONSE:');
      console.log('======================');
      console.log(JSON.stringify({ success: true, data: applications }, null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
