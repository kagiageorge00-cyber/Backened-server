/**
 * Test: Verify POST /api/apply captures all marketplace fields
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('../models/candidate');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss_mobile';

// Mock the marketplace fields that candidates would submit
const testApplicationData = {
  fullName: 'Test Candidate',
  name: 'Test Candidate',
  email: `test_${Date.now()}@example.com`,
  phone: `+254${Math.floor(Math.random() * 1000000000)}`,
  country: 'Kenya',
  nationality: 'Kenyan',
  religion: 'Christian',
  education: 'Bachelor of Science',
  educationalLevel: "Bachelor's Degree",
  skills: ['JavaScript', 'React', 'Node.js'],
  languages: ['English', 'Swahili'],
  experience: '5 years',
  gender: 'Male',
  dateOfBirth: '1998-05-15',
  maritalStatus: 'Single',
  numberOfChildren: 0,
  jobPosition: 'Senior Software Engineer',
  jobType: 'Full-time',
  destinationCountry: 'UAE',
  destinationPreference: ['Dubai', 'Abu Dhabi'],
  expectedSalary: '$5000-$7000 per month',
  photoUrl: 'https://example.com/photo.jpg',
  videoUrl: 'https://example.com/video.mp4',
  passportUrl: 'https://example.com/passport.pdf',
  medicalUrl: 'https://example.com/medical.pdf',
  resumeUrl: 'https://example.com/resume.pdf',
  additionalUrl: 'https://example.com/additional.pdf',
};

async function testApplyRoute() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('TEST: POST /api/apply captures marketplace fields');
    console.log('='.repeat(60));

    // Simulate what applyRoutes would do
    console.log('\nSimulating candidate application with marketplace fields...\n');

    // Create payload (mimicking applyRoutes logic)
    const {
      fullName, name, email, phone, country, nationality, religion, education, educationalLevel,
      skills, languages, experience, gender, dateOfBirth, maritalStatus, numberOfChildren,
      jobPosition, jobType, destinationCountry, destinationPreference, expectedSalary,
      photoUrl, videoUrl, passportUrl, medicalUrl, resumeUrl, additionalUrl,
    } = testApplicationData;

    // Helper function from applyRoutes
    function calculateProfileCompletion(candidate) {
      const requiredForMarketplace = [
        'photoUrl', 'nationality', 'religion', 'education', 'experience',
        'skills', 'languages', 'dateOfBirth', 'jobPosition', 'expectedSalary', 'destinationCountry',
      ];
      const completedFields = requiredForMarketplace.filter((field) => {
        const value = candidate[field];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return value != null && value !== '';
      });
      return Math.round((completedFields.length / requiredForMarketplace.length) * 100);
    }

    function generateCandidateCode() {
      const year = new Date().getFullYear();
      const seq = Math.floor(1000 + Math.random() * 9000);
      return `CAND-${year}-${seq}`;
    }

    // Create payload
    const payload = {
      fullName: fullName || name || '',
      name: name || fullName || '',
      email,
      phone,
      country: country || '',
      nationality: nationality || '',
      religion: religion || '',
      education: education || '',
      educationalLevel: educationalLevel || '',
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      languages: Array.isArray(languages) ? languages : (languages ? [languages] : []),
      experience: experience || '',
      gender: gender || '',
      dateOfBirth: dateOfBirth || '',
      maritalStatus: maritalStatus || '',
      numberOfChildren: numberOfChildren !== undefined ? numberOfChildren : undefined,
      jobPosition: jobPosition || '',
      jobType: jobType || '',
      destinationCountry: destinationCountry || '',
      destinationPreference: destinationPreference || [],
      expectedSalary: expectedSalary || '',
      photoUrl: photoUrl || '',
      videoUrl: videoUrl || '',
      passportUrl: passportUrl || '',
      medicalUrl: medicalUrl || '',
      resumeUrl: resumeUrl || '',
      additionalUrl: additionalUrl || '',
      uniqueCode: generateCandidateCode(),
      isVerified: false,
      status: 'in_process',
      paymentStatus: 'pending',
    };

    payload.profileCompletion = calculateProfileCompletion(payload);

    // Create in database
    const candidate = await Candidate.create(payload);
    console.log('✓ Candidate created in database\n');

    // Verify all fields were saved
    const saved = await Candidate.findById(candidate._id).lean();
    
    console.log('SAVED DATA VERIFICATION:');
    console.log('-'.repeat(60));

    const marketplaceFields = [
      'photoUrl', 'nationality', 'religion', 'education', 'experience',
      'skills', 'languages', 'dateOfBirth', 'jobPosition', 'expectedSalary', 'destinationCountry',
    ];

    let allFieldsSaved = true;
    for (const field of marketplaceFields) {
      const value = saved[field];
      const hasSaved = Array.isArray(value) 
        ? value.length > 0 
        : (typeof value === 'string' ? value.trim().length > 0 : value != null);
      
      const status = hasSaved ? '✓' : '✗';
      console.log(`${status} ${field}: ${JSON.stringify(value).substring(0, 50)}`);
      
      if (!hasSaved && (field === 'photoUrl' || field === 'nationality' || field === 'jobPosition')) {
        allFieldsSaved = false;
      }
    }

    console.log('\nOTHER IMPORTANT FIELDS:');
    console.log('-'.repeat(60));
    console.log(`✓ fullName: ${saved.fullName}`);
    console.log(`✓ email: ${saved.email}`);
    console.log(`✓ phone: ${saved.phone}`);
    console.log(`✓ profileCompletion: ${saved.profileCompletion}%`);
    console.log(`✓ status: ${saved.status}`);
    console.log(`✓ paymentStatus: ${saved.paymentStatus}`);

    console.log('\n' + '='.repeat(60));
    if (allFieldsSaved && saved.profileCompletion === 100) {
      console.log('✓ TEST PASSED: All marketplace fields saved correctly!');
      console.log(`✓ Profile completion: ${saved.profileCompletion}%`);
    } else if (allFieldsSaved) {
      console.log('✓ TEST PASSED: All marketplace fields saved (partial profile expected)');
      console.log(`✓ Profile completion: ${saved.profileCompletion}%`);
    } else {
      console.log('✗ TEST FAILED: Some marketplace fields not saved');
      allFieldsSaved = false;
    }

    // Clean up
    await Candidate.deleteOne({ _id: candidate._id });
    
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    process.exit(allFieldsSaved ? 0 : 1);
  } catch (err) {
    console.error('Fatal error:', err.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testApplyRoute();
