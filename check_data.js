require('dotenv').config();
const mongoose = require('mongoose');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB blissdb\n');
    
    // Load models
    const Candidate = require('./models/candidate');
    const Job = require('./models/Job');
    
    // Check candidates
    console.log('=== CANDIDATES ===');
    const totalCand = await Candidate.countDocuments();
    console.log('Total count:', totalCand);
    
    // Get distribution by status
    const statuses = await Candidate.collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    statuses.forEach(s => {
      console.log('  status="' + s._id + '":', s.count);
    });
    
    // Check verification
    const verified = await Candidate.countDocuments({ isVerified: true });
    const unverified = await Candidate.countDocuments({ isVerified: false });
    console.log('  isVerified=true:', verified);
    console.log('  isVerified=false:', unverified);
    
    // Check jobs
    console.log('\n=== JOBS ===');
    const totalJobs = await Job.countDocuments();
    console.log('Total count:', totalJobs);
    
    // Get distribution by status
    const jobStatuses = await Job.collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    jobStatuses.forEach(s => {
      console.log('  status="' + s._id + '":', s.count);
    });
    
    // Summary
    console.log('\n=== VISIBILITY CHECK ===');
    const marketplaceCand = await Candidate.countDocuments({ isVerified: true, status: 'available' });
    const marketplaceJobs = await Job.countDocuments({ status: 'Active' });
    
    console.log('Visible in marketplace (candidates):', marketplaceCand, '(hidden:', (totalCand - marketplaceCand) + ')');
    console.log('Visible in marketplace (jobs):', marketplaceJobs, '(hidden:', (totalJobs - marketplaceJobs) + ')');
    
    console.log('\n✅ Data inspection complete - records exist but hidden by API filters');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

inspect();
