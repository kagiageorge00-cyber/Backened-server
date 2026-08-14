const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

async function createApplications() {
  try {
    console.log('🔌 Connecting to MongoDB (URI: ' + process.env.MONGO_URI.substring(0, 50) + '...)');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB\n');

    // Define schemas
    const candidateSchema = new mongoose.Schema({}, { strict: false, collection: 'candidates' });
    const jobSchema = new mongoose.Schema({}, { strict: false, collection: 'jobs' });
    const appSchema = new mongoose.Schema({}, { strict: false, collection: 'applications' });

    const Candidate = mongoose.model('Candidate', candidateSchema);
    const Job = mongoose.model('Job', jobSchema);
    const Application = mongoose.model('Application', appSchema);

    // Step 1: Find candidate
    console.log('🔍 Finding candidate CAND-2026-3741...');
    const candidate = await Candidate.findOne({ uniqueCode: 'CAND-2026-3741' }).lean();
    
    if (!candidate) {
      console.log('❌ Candidate not found');
      await conn.disconnect();
      process.exit(1);
    }
    
    console.log(`✅ Found: ${candidate.fullName}\n`);

    // Step 2: Find jobs
    console.log('📍 Fetching available jobs...');
    const jobs = await Job.find({}).limit(8).lean();
    
    console.log(`✅ Found ${jobs.length} jobs\n`);

    if (jobs.length === 0) {
      console.log('❌ No jobs available to apply for');
      await conn.disconnect();
      process.exit(1);
    }

    // Step 3: Create applications
    console.log('📝 Creating applications...\n');
    const applications = [];
    
    for (let i = 0; i < Math.min(5, jobs.length); i++) {
      const job = jobs[i];
      const app = new Application({
        candidateId: candidate._id.toString(),
        employerId: job.employerId || `EMP-${Date.now()}`,
        jobId: job._id.toString(),
        jobTitle: job.title || job.jobTitle || 'Unknown Position',
        country: job.country || 'Unknown',
        salary: job.salary ? `${job.salary} ${job.currency || ''}` : 'Competitive',
        status: 'Submitted',
        createdAt: new Date(),
      });
      
      await app.save();
      applications.push(app.toObject());
      console.log(`✅ [${i + 1}] ${app.jobTitle} (${app.country})`);
    }

    console.log(`\n📊 Successfully created ${applications.length} applications!\n`);

    // Step 4: Fetch all applications to verify
    console.log('🔎 Fetching all applications for this candidate...\n');
    const allApps = await Application.find({
      candidateId: candidate._id.toString()
    }).sort({ createdAt: -1 }).lean();

    console.log('📋 APPLICATIONS:');
    console.log('================');
    allApps.forEach((app, idx) => {
      console.log(`\n[${idx + 1}] ${app.jobTitle}`);
      console.log(`    Country: ${app.country}`);
      console.log(`    Salary: ${app.salary}`);
      console.log(`    Status: ${app.status}`);
      console.log(`    Date: ${new Date(app.createdAt).toLocaleDateString()}`);
    });

    console.log(`\n✅ TOTAL: ${allApps.length} applications`);
    
    // Step 5: Output API response format
    console.log('\n\n📱 API Response Format:');
    console.log('=======================');
    console.log(JSON.stringify({
      success: true,
      count: allApps.length,
      data: allApps.map(app => ({
        _id: app._id,
        candidateId: app.candidateId,
        employerId: app.employerId,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        country: app.country,
        salary: app.salary,
        status: app.status,
        createdAt: app.createdAt
      }))
    }, null, 2));

    await conn.disconnect();
    console.log('\n✅ Done!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createApplications();
