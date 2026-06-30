const express = require('express');
const Candidate = require('../models/candidate');

const router = express.Router();

const sendError = (res, status, error) => res.status(status).json({ success: false, error });

// Helper: calculate profile completion based on marketplace fields
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

router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      name,
      email,
      phone,
      country,
      nationality,
      religion,
      education,
      educationalLevel,
      skills,
      languages,
      experience,
      gender,
      dateOfBirth,
      maritalStatus,
      numberOfChildren,
      jobPosition,
      jobType,
      destinationCountry,
      destinationPreference,
      expectedSalary,
      photoUrl,
      videoUrl,
      passportUrl,
      medicalUrl,
      resumeUrl,
      additionalUrl,
    } = req.body || {};

    if (!email || !phone) {
      return sendError(res, 400, 'email and phone are required');
    }

    let candidate = await Candidate.findOne({ $or: [{ email }, { phone }] });

    const payload = {
      fullName: fullName || name || candidate?.fullName || '',
      name: name || fullName || candidate?.name || '',
      email,
      phone,
      country: country || candidate?.country || '',
      nationality: nationality || candidate?.nationality || '',
      religion: religion || candidate?.religion || '',
      education: education || candidate?.education || '',
      educationalLevel: educationalLevel || candidate?.educationalLevel || '',
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : candidate?.skills || []),
      languages: Array.isArray(languages) ? languages : (languages ? [languages] : candidate?.languages || []),
      experience: experience || candidate?.experience || '',
      gender: gender || candidate?.gender || '',
      dateOfBirth: dateOfBirth || candidate?.dateOfBirth || '',
      maritalStatus: maritalStatus || candidate?.maritalStatus || '',
      numberOfChildren: numberOfChildren !== undefined ? numberOfChildren : candidate?.numberOfChildren,
      jobPosition: jobPosition || candidate?.jobPosition || '',
      jobType: jobType || candidate?.jobType || '',
      destinationCountry: destinationCountry || candidate?.destinationCountry || '',
      destinationPreference: destinationPreference || candidate?.destinationPreference || [],
      expectedSalary: expectedSalary || candidate?.expectedSalary || '',
      photoUrl: photoUrl || candidate?.photoUrl || '',
      videoUrl: videoUrl || candidate?.videoUrl || '',
      passportUrl: passportUrl || candidate?.passportUrl || '',
      medicalUrl: medicalUrl || candidate?.medicalUrl || '',
      resumeUrl: resumeUrl || candidate?.resumeUrl || '',
      additionalUrl: additionalUrl || candidate?.additionalUrl || '',
      isVerified: candidate?.isVerified ?? false,
      status: candidate?.status || 'in_process',
      paymentStatus: candidate?.paymentStatus || 'pending',
    };

    if (candidate) {
      // Update existing candidate
      Object.assign(candidate, payload);
      candidate.profileCompletion = calculateProfileCompletion(candidate);
      candidate = await candidate.save();
    } else {
      // Create new candidate
      payload.profileCompletion = calculateProfileCompletion(payload);
      candidate = await Candidate.create(payload);
    }

    return res.status(201).json({
      success: true,
      message: 'Application received successfully',
      data: candidate,
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to process application');
  }
});

module.exports = router;
