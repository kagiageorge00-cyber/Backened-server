require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('./models/candidate');
const Job = require('./models/Job');

(async () => {
  try {
    console.log('🔍 FORENSIC DATABASE INSPECTION');
    console.log('================================\n');
    const uri = process.env.MONGO_URI;
    console.log('MongoDB URI:', uri.replace(/:[^:@]*@/, ':***@'));
    
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const dbName = db.getName();
    console.log('📊 Database Name:', dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections found:', collections.length);
    collections.forEach(c => console.log('  -', c.name));
    
    console.log('\n================================');
    console.log('CANDIDATES COLLECTION ANALYSIS');
    console.log('================================\n');
    
    const totalCandidates = await Candidate.countDocuments();
    console.log('Total candidates in DB:', totalCandidates);
    
    const byStatus = await Candidate.collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\nCandidates by status:');
    byStatus.forEach(s => console.log('  ' + (s._id || 'null') + ':', s.count));
    
    const byVerification = await Candidate.collection.aggregate([
      { $group: { _id: '$isVerified', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\nCandidates by verification:');
    byVerification.forEach(v => console.log('  isVerified=' + v._id + ':', v.count));
    
    // Show sample candidates from each status
    const statuses = ['available', 'in_process', 'deployed', 'approved', 'rejected'];
    for (const status of statuses) {
      const count = await Candidate.countDocuments({ status });
      if (count > 0) {
        const sample = await Candidate.findOne({ status }).lean();
        console.log('\n  Sample ' + status + ':', sample._id, sample.fullName || sample.name);
      }
    }
    
    console.log('\n================================');
    console.log('JOBS COLLECTION ANALYSIS');
    console.log('================================\n');
    
    const totalJobs = await Job.countDocuments();
    console.log('Total jobs in DB:', totalJobs);
    
    const jobsByStatus = await Job.collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\nJobs by status:');
    jobsByStatus.forEach(s => console.log('  ' + (s._id || 'null') + ':', s.count));
    
    // Show sample jobs from each status
    const jobStatuses = ['Active', 'Draft', 'Paused', 'Closed', 'Expired', 'open', 'closed', 'paused'];
    for (const status of jobStatuses) {
      const count = await Job.countDocuments({ status });
      if (count > 0) {
        const sample = await Job.findOne({ status }).lean();
        console.log('\n  Sample ' + status + ':', sample._id, sample.jobTitle);
      }
    }
    
    console.log('\n================================');
    console.log('API VISIBILITY CHECK');
    console.log('================================\n');
    
    const visibleCandidates = await Candidate.countDocuments({ isVerified: true, status: 'available' });
    console.log('Marketplace candidates (isVerified=true, status=available):', visibleCandidates);
    
    const visibleJobs = await Job.countDocuments({ status: 'Active' });
    console.log('Marketplace jobs (status=Active):', visibleJobs);
    
    console.log('\n================================');
    console.log('SUMMARY');
    console.log('================================\n');
    console.log('✅ Total candidates:', totalCandidates, '(visible:', visibleCandidates + ')');
    console.log('✅ Total jobs:', totalJobs, '(visible:', visibleJobs + ')');
    console.log('\n📌 DATA STATUS: Records exist but many are hidden by API filters');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
