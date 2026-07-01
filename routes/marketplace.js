const express = require('express');
const Candidate = require('../models/candidate');
const employerAuth = require('../middleware/employerAuth');
const { getCandidateNameValue } = require('../utils/candidateDisplayName');
const router = express.Router();

function requireVerifiedEmployer(req, res) {
  const employer = req.employer;
  if (!employer || employer.status !== 'active' || !['verified_employer', 'active_employer'].includes(employer.verificationStatus)) {
    res.status(403).json({ success: false, error: 'Employer account is not verified or active' });
    return false;
  }
  return true;
}

function normalizeMarketplaceCandidate(candidate) {
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  const birthDate = candidateObj.dateOfBirth ? new Date(candidateObj.dateOfBirth) : null;
  const age = birthDate && !Number.isNaN(birthDate.getTime())
    ? new Date().getFullYear() - birthDate.getFullYear()
    : null;

  if (!candidateObj.candidateId) {
    candidateObj.candidateId = candidateObj.uniqueCode || (candidateObj._id ? candidateObj._id.toString() : null);
  }

  const languages = Array.isArray(candidateObj.languages) ? candidateObj.languages : [];
  const skills = Array.isArray(candidateObj.skills) ? candidateObj.skills : [];
  const experience = candidateObj.experience;
  const experienceLabel = experience !== undefined && experience !== null
    ? (typeof experience === 'string'
        ? experience.trim().length > 0
          ? (/^\d+$/.test(experience.trim()) ? `${experience.trim()} Years` : experience.trim())
          : null
        : `${experience} Years`)
    : null;
  const destinationPreference = Array.isArray(candidateObj.destinationPreference)
    ? candidateObj.destinationPreference.join(', ')
    : (candidateObj.destinationPreference || candidateObj.preferredDestination || candidateObj.preferredDestinations || null);
  const mappedJobPosition = candidateObj.jobPosition || candidateObj.jobAppliedFor || candidateObj.appliedJobTitle || null;
  const profilePhoto = candidateObj.photoUrl || candidateObj.profilePhoto || candidateObj.imageUrl || null;
  const avatarUrl = profilePhoto || candidateObj.profilePhotoUrl || null;
  const availabilityLabel = candidateObj.status === 'available' || candidateObj.availability === 'Available'
    ? 'Immediately Available'
    : (candidateObj.availability || candidateObj.status || 'Unavailable');
  const hasVideo = !!candidateObj.videoUrl;
  const hasPassport = !!candidateObj.passportUrl;
  const hasMedical = !!candidateObj.medicalUrl;
  const hasResume = !!candidateObj.resumeUrl;
  const hasDocuments = !!(candidateObj.documents && (candidateObj.documents.certificates?.length || candidateObj.documents.uploads?.length));

  return {
    // IDENTIFICATION
    candidateId: candidateObj.candidateId,
    fullName: getCandidateNameValue(candidateObj),
    name: getCandidateNameValue(candidateObj),

    // PERSONAL
    nationality: candidateObj.nationality,
    religion: candidateObj.religion,
    age,
    maritalStatus: candidateObj.maritalStatus,
    numberOfChildren: candidateObj.numberOfChildren,

    // PROFESSIONAL
    jobPosition: mappedJobPosition,
    experience: experienceLabel,
    education: candidateObj.education || candidateObj.educationalLevel,
    skills: skills,
    languages: languages,
    expectedSalary: candidateObj.expectedSalary,

    // LOCATION
    destinationCountry: candidateObj.destinationCountry,
    destinationPreference,

    // MEDIA
    photoUrl: profilePhoto,
    profilePhoto: profilePhoto,
    profilePhotoUrl: avatarUrl,
    imageUrl: profilePhoto,
    avatarUrl: avatarUrl,
    videoAvailable: hasVideo,
    passportAvailable: hasPassport,
    medicalAvailable: hasMedical,
    resumeAvailable: hasResume,
    documentsAvailable: hasDocuments,
    introductionVideoAvailable: hasVideo,
    certificateOfGoodConductAvailable: hasDocuments,
    cvAvailable: hasResume,

    // LABELS
    languagesLabel: languages.length ? languages.join(', ') : null,
    skillsLabel: skills.length ? skills.join(', ') : null,

    // STATUS
    profileCompletion: candidateObj.profileCompletion || 0,
    currentStatus: candidateObj.currentStatus,
    status: candidateObj.status,
    availability: availabilityLabel,
    availabilityBadge: candidateObj.status === 'available' ? 'Verified' : 'Pending',
    verified: candidateObj.isVerified === true,
  };
}

router.use(employerAuth);

// GET /api/marketplace/candidates
router.get('/candidates', async (req, res) => {
  try {
    if (!requireVerifiedEmployer(req, res)) return;

    const { country, skills, experience, verified, page = 1, limit = 20 } = req.query;
    const query = { isVerified: true, status: 'available' };
    if (country) query.country = country;
    if (experience) query.experience = { $regex: experience, $options: 'i' };
    if (skills) query.skills = { $in: skills.split(',').map((s) => s.trim()) };
    if (verified !== undefined && verified !== 'true') {
      return res.status(400).json({ success: false, error: 'Marketplace only returns verified candidates' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const candidates = await Candidate.find(query).skip(skip).limit(Number(limit)).select('-password');

    return res.json({ success: true, data: candidates.map(normalizeMarketplaceCandidate) });
  } catch (err) {
    console.error('Marketplace error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/candidates/:candidateId', employerAuth, async (req, res) => {
  try {
    if (!requireVerifiedEmployer(req, res)) return;

    const { candidateId } = req.params;
    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required' });
    }

    const query = {
      $or: [
        { candidateId },
        { uniqueCode: candidateId },
        { phone: candidateId },
        { email: candidateId },
      ],
      isVerified: true,
      status: 'available',
    };

    const candidate = await Candidate.findOne(query).select('-password');
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const candidateObj = normalizeMarketplaceCandidate(candidate);
    const contactInfo = candidate.contactReleased
      ? {
          email: candidate.email,
          phone: candidate.phone,
          nationality: candidate.nationality,
        }
      : null;

    return res.json({
      success: true,
      data: {
        ...candidateObj,
        contactReleased: candidate.contactReleased,
        contactInfo,
        privateAccess: candidate.contactReleased,
      },
    });
  } catch (err) {
    console.error('Marketplace candidate detail error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
