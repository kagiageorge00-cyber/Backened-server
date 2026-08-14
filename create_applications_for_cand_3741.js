const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    // Models
    const Candidate = mongoose.model('Candidate', new mongoose.Schema({}, { strict: false, collection: 'candidates' }));
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'jobs' }));
    const Application = mongoose.model('Application', new mongoose.Schema({}, { strict: false, collection: 'applications' }));

    // Get Esther
    const esther = await Candidate.findOne({ uniqueCode: 'CAND-2026-3741' }).lean();
    console.log(`👤 Candidate: ${esther.fullName} (${esther.uniqueCode})\n`);

    // Get available jobs
    const jobs = await Job.find({}).limit(15).lean();
    console.log(`📋 Found ${jobs.length} jobs in system\n`);

    if (jobs.length === 0) {
      console.log('❌ No jobs found to apply for');
      process.exit(1);
    }

    // Create applications for the first 5 jobs
    const jobsToApplyFor = jobs.slice(0, 5);
    console.log(`✍️  Creating applications for first 5 jobs...\n`);

    const createdApps = [];
    for (const job of jobsToApplyFor) {
      const app = await Application.create({
        candidateId: esther._id.toString(),
        employerId: job.employerId || 'system',
        jobId: job._id.toString(),
        jobTitle: job.title || job.jobTitle || 'Unknown',
        country: job.country || 'Unknown',
        salary: job.salary ? `${job.salary} ${job.currency || 'Unknown'}` : 'Competitive',
        status: 'Submitted',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      createdApps.push(app);
      console.log(`✅ Applied to: ${app.jobTitle} (${app.country})`);
    }

    console.log(`\n📊 CREATED ${createdApps.length} APPLICATIONS\n`);

    // Now fetch all applications
    const allApplications = await Application.find({ 
      candidateId: esther._id.toString() 
    }).sort({ createdAt: -1 }).lean();

    console.log('📱 APPLICATIONS FOR ESTHER:');
    console.log('============================');
    allApplications.forEach((app, idx) => {
      console.log(`\n[${idx + 1}] ${app.jobTitle}`);
      console.log(`    Country: ${app.country}`);
      console.log(`    Salary: ${app.salary}`);
      console.log(`    Status: ${app.status}`);
      console.log(`    Applied: ${new Date(app.createdAt).toISOString().split('T')[0]}`);
    });

    console.log(`\n\n✅ TOTAL APPLICATIONS: ${allApplications.length}`);

    // Output JSON for API response
    console.log('\n\n📋 API RESPONSE (for /api/candidate_portal/applications):');
    console.log('========================================================');
    console.log(JSON.stringify({
      success: true,
      count: allApplications.length,
      data: allApplications
    }, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
