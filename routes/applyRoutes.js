const express = require('express');
const bcrypt = require('bcryptjs');
const Candidate = require('../models/candidate');

const router = express.Router();

function generateCandidateCode() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `CAND-${year}-${seq}`;
}

const sendError = (res, status, error) => res.status(status).json({ success: false, error });

function resolveFieldValue(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value;
}

function normalizeMaritalStatus(value) {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'single':
      return 'Single';
    case 'married':
      return 'Married';
    case 'divorced':
      return 'Divorced';
    case 'widowed':
      return 'Widowed';
    case 'separated':
      return 'Separated';
    default:
      return value.trim();
  }
}

function normalizeEducationalLevel(value) {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'primary':
      return 'Primary';
    case 'secondary':
      return 'Secondary';
    case 'vocational':
    case 'vocational/technical':
    case 'technical':
      return 'Vocational/Technical';
    case 'diploma':
      return 'Diploma';
    case 'bachelor':
    case 'bachelors':
    case "bachelor's degree":
    case 'bachelors degree':
      return "Bachelor's Degree";
    case 'master':
    case 'masters':
    case "master's degree":
    case 'masters degree':
      return "Master's Degree";
    case 'phd':
    case 'doctorate':
      return 'PhD';
    case 'other':
      return 'Other';
    default:
      return value.trim();
  }
}

function normalizePaymentStatus(value) {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Failed';
    case 'unpaid':
      return 'Unpaid';
    default:
      return value.trim();
  }
}

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
      candidateId,
      password,
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
      jobAppliedFor,
      jobType,
      destinationCountry,
      destinationPreference,
      preferredDestination,
      preferredDestinations,
      expectedSalary,
      appliedJobId,
      appliedJobTitle,
      appliedEmployerId,
      appliedEmployerName,
      photoUrl,
      videoUrl,
      passportUrl,
      medicalUrl,
      resumeUrl,
      additionalUrl,
      goodConductUrl,
      introductionVideoUrl,
      otherDocumentUrl,
      nationalIdFrontUrl,
      nationalIdBackUrl,
      documents,
      candidateFormLink,
    } = req.body || {};

    if (!email || !phone) {
      return sendError(res, 400, 'email and phone are required');
    }

    let candidate = await Candidate.findOne({
      $or: [
        { email },
        { phone },
        { uniqueCode: candidateId },
      ],
    });

    let hashedPassword = candidate?.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const normalizedDestination = destinationCountry || preferredDestination || preferredDestinations || candidate?.destinationCountry || '';
    const normalizedDestinationPreferences = Array.isArray(destinationPreference)
      ? destinationPreference
      : (Array.isArray(preferredDestinations)
          ? preferredDestinations
          : (Array.isArray(preferredDestination)
              ? preferredDestination
              : (preferredDestination
                  ? [preferredDestination]
                  : (destinationCountry
                      ? [destinationCountry]
                      : (candidate?.destinationPreference || (candidate?.destinationCountry ? [candidate.destinationCountry] : []))))));
    const normalizedJobPosition = jobPosition || jobAppliedFor || candidate?.jobPosition || candidate?.jobAppliedFor || '';

    const normalizedDocuments = {
      passportPhoto: resolveFieldValue(
        documents?.passportPhoto || passportUrl || photoUrl || candidate?.documents?.passportPhoto || candidate?.passportUrl || '',
        candidate?.documents?.passportPhoto || candidate?.passportUrl || ''
      ),
      nationalId: resolveFieldValue(documents?.nationalId || candidate?.documents?.nationalId || '', candidate?.documents?.nationalId || ''),
      cv: resolveFieldValue(documents?.cv || resumeUrl || candidate?.documents?.cv || candidate?.resumeUrl || '', candidate?.documents?.cv || candidate?.resumeUrl || ''),
      certificates: Array.isArray(documents?.certificates)
        ? documents.certificates
        : (Array.isArray(candidate?.documents?.certificates) ? candidate.documents.certificates : []),
      coverLetter: resolveFieldValue(documents?.coverLetter || additionalUrl || candidate?.documents?.coverLetter || candidate?.additionalUrl || '', candidate?.documents?.coverLetter || candidate?.additionalUrl || ''),
      uploads: Array.isArray(documents?.uploads)
        ? documents.uploads
        : (Array.isArray(candidate?.documents?.uploads) ? candidate.documents.uploads : []),
    };

    const payload = {
      fullName: resolveFieldValue(fullName, resolveFieldValue(name, candidate?.fullName || '')),
      name: resolveFieldValue(name, resolveFieldValue(fullName, candidate?.name || '')),
      email,
      phone,
      uniqueCode: candidate?.uniqueCode || candidateId || generateCandidateCode(),
      country: resolveFieldValue(country, candidate?.country || ''),
      nationality: resolveFieldValue(nationality, candidate?.nationality || ''),
      religion: resolveFieldValue(religion, candidate?.religion || ''),
      education: resolveFieldValue(education, candidate?.education || ''),
      educationalLevel: resolveFieldValue(normalizeEducationalLevel(educationalLevel), normalizeEducationalLevel(candidate?.educationalLevel)),
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : candidate?.skills || []),
      languages: Array.isArray(languages) ? languages : (languages ? [languages] : candidate?.languages || []),
      experience: resolveFieldValue(experience, candidate?.experience || ''),
      gender: resolveFieldValue(gender, candidate?.gender || ''),
      dateOfBirth: resolveFieldValue(dateOfBirth, candidate?.dateOfBirth || ''),
      maritalStatus: resolveFieldValue(normalizeMaritalStatus(maritalStatus), normalizeMaritalStatus(candidate?.maritalStatus)),
      numberOfChildren: numberOfChildren === undefined ? candidate?.numberOfChildren : numberOfChildren,
      jobPosition: normalizedJobPosition,
      jobAppliedFor: normalizedJobPosition,
      jobType: resolveFieldValue(jobType, candidate?.jobType || ''),
      destinationCountry: normalizedDestination,
      destinationPreference: normalizedDestinationPreferences,
      expectedSalary: resolveFieldValue(expectedSalary, candidate?.expectedSalary || ''),
      appliedJobId: resolveFieldValue(appliedJobId, candidate?.appliedJobId || ''),
      appliedJobTitle: resolveFieldValue(appliedJobTitle, candidate?.appliedJobTitle || ''),
      appliedEmployerId: resolveFieldValue(appliedEmployerId, candidate?.appliedEmployerId || ''),
      appliedEmployerName: resolveFieldValue(appliedEmployerName, candidate?.appliedEmployerName || ''),
      photoUrl: resolveFieldValue(photoUrl, candidate?.photoUrl || ''),
      videoUrl: resolveFieldValue(introductionVideoUrl, resolveFieldValue(videoUrl, candidate?.videoUrl || '')),
      introductionVideoUrl: resolveFieldValue(introductionVideoUrl, candidate?.introductionVideoUrl || ''),
      passportUrl: resolveFieldValue(passportUrl, candidate?.passportUrl || ''),
      medicalUrl: resolveFieldValue(medicalUrl, candidate?.medicalUrl || ''),
      resumeUrl: resolveFieldValue(resumeUrl, candidate?.resumeUrl || ''),
      additionalUrl: resolveFieldValue(additionalUrl, candidate?.additionalUrl || ''),
      goodConductUrl: resolveFieldValue(goodConductUrl, candidate?.goodConductUrl || ''),
      otherDocumentUrl: resolveFieldValue(otherDocumentUrl, candidate?.otherDocumentUrl || ''),
      nationalIdFrontUrl: resolveFieldValue(nationalIdFrontUrl, candidate?.nationalIdFrontUrl || ''),
      nationalIdBackUrl: resolveFieldValue(nationalIdBackUrl, candidate?.nationalIdBackUrl || ''),
      candidateFormLink: resolveFieldValue(candidateFormLink, candidate?.candidateFormLink || ''),
      documents: normalizedDocuments,
      isVerified: candidate?.isVerified ?? false,
      status: candidate?.status || 'in_process',
      paymentStatus: normalizePaymentStatus(candidate?.paymentStatus) || 'Pending',
    };

    if (hashedPassword) {
      payload.password = hashedPassword;
    }

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
