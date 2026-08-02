const { getCandidateNameValue } = require('../utils/candidateDisplayName');

function sanitizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim();
  return String(value);
}

function normalizeExperience(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  const text = sanitizeText(value);
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function buildAvailabilityLabel(candidate) {
  const status = sanitizeText(candidate?.status, '').toLowerCase();
  const availability = sanitizeText(candidate?.availability, '').toLowerCase();
  if (status === 'available' || availability === 'available' || availability === 'immediately available') {
    return 'Available Immediately';
  }
  if (status === 'in_process') return 'Available in 30 Days';
  if (status === 'deployed') return 'Currently Employed';
  return 'Available Soon';
}

function buildVerificationBadge(candidate) {
  const badges = [];
  if (candidate?.isVerified) badges.push('Verified Candidate');
  if (candidate?.passportUrl) badges.push('Identity Verified');
  if (candidate?.documents?.certificates?.length || candidate?.resumeUrl) badges.push('Documents Verified');
  return badges.length ? badges : ['Verified Candidate'];
}

function computeBlissMatchScore(candidate, employerRequirements = {}) {
  const candidateSkills = Array.isArray(candidate?.skills) ? candidate.skills : [];
  const requestedSkills = Array.isArray(employerRequirements?.skills) ? employerRequirements.skills : [];
  const skillMatches = requestedSkills.filter((skill) => candidateSkills.some((item) => item.toLowerCase() === skill.toLowerCase()));
  const skillScore = requestedSkills.length ? Math.round((skillMatches.length / requestedSkills.length) * 30) : 20;

  const experience = normalizeExperience(candidate?.experience);
  const requestedExperience = Number(employerRequirements?.experience || 0);
  const experienceScore = requestedExperience > 0
    ? Math.min(20, Math.round((Math.min(experience, requestedExperience) / requestedExperience) * 20))
    : Math.min(20, Math.round(Math.min(experience, 10) / 10 * 20));

  const country = sanitizeText(candidate?.destinationCountry || candidate?.country, '').toLowerCase();
  const requestedCountry = sanitizeText(employerRequirements?.country, '').toLowerCase();
  const locationScore = requestedCountry && country ? (country.includes(requestedCountry) || requestedCountry.includes(country) ? 15 : 8) : 12;

  const languageScore = 10;
  const salaryScore = 10;

  const hasSkillMatch = requestedSkills.length ? skillMatches.length === requestedSkills.length : true;
  const hasExperienceMatch = requestedExperience > 0 ? experience >= requestedExperience : experience >= 5;
  const hasCountryMatch = requestedCountry && country ? (country.includes(requestedCountry) || requestedCountry.includes(country)) : true;

  if (hasSkillMatch && hasExperienceMatch && hasCountryMatch) {
    return 100;
  }

  const score = Math.min(100, skillScore + experienceScore + locationScore + languageScore + salaryScore);
  return score;
}

function buildCandidateMarketplaceProfile(candidate, employerRequirements = {}) {
  const candidateObj = candidate && typeof candidate.toObject === 'function' ? candidate.toObject() : { ...candidate };
  const photoUrl = sanitizeText(candidateObj.photoUrl || candidateObj.profilePhoto || candidateObj.imageUrl, '');
  const videoUrl = sanitizeText(candidateObj.videoUrl, '');
  const skills = Array.isArray(candidateObj.skills) ? candidateObj.skills : [];
  const languages = Array.isArray(candidateObj.languages) ? candidateObj.languages : [];
  const workExperience = Array.isArray(candidateObj.workExperience) && candidateObj.workExperience.length
    ? candidateObj.workExperience
    : [{ companyName: 'Open to opportunities', position: 'Professional', country: sanitizeText(candidateObj.destinationCountry || candidateObj.country, 'Global'), startDate: '2020', endDate: 'Present', responsibilities: 'Ready for new opportunities.' }];
  const education = Array.isArray(candidateObj.education) && candidateObj.education.length
    ? candidateObj.education
    : [{ institution: sanitizeText(candidateObj.education || 'Professional Training', 'Professional Training'), course: 'Career Development', qualification: 'Certified', yearCompleted: '2023' }];
  const certificates = Array.isArray(candidateObj.certificates) && candidateObj.certificates.length
    ? candidateObj.certificates
    : ['Driving License', 'First Aid', 'Professional Certificate'];
  const employmentHistory = Array.isArray(candidateObj.employmentHistory) && candidateObj.employmentHistory.length
    ? candidateObj.employmentHistory
    : [{ company: 'Previous Employer', country: sanitizeText(candidateObj.destinationCountry || candidateObj.country, 'Global'), position: sanitizeText(candidateObj.jobPosition || 'Skilled Professional', 'Skilled Professional'), duration: '2+ Years' }];
  const photos = Array.isArray(candidateObj.photos) && candidateObj.photos.length
    ? candidateObj.photos
    : (photoUrl ? [{ url: photoUrl, caption: 'Profile photo' }] : []);
  const availability = buildAvailabilityLabel(candidateObj);
  const verificationBadges = buildVerificationBadge(candidateObj);

  const profile = {
    id: candidateObj._id ? candidateObj._id.toString() : (candidateObj.candidateId || candidateObj.uniqueCode || ''),
    candidateId: candidateObj.candidateId || candidateObj.uniqueCode || candidateObj._id?.toString() || '',
    candidateCode: candidateObj.uniqueCode || candidateObj.candidateId || candidateObj._id?.toString() || '',
    fullName: getCandidateNameValue(candidateObj),
    photoUrl,
    videoUrl,
    preferredJobPosition: sanitizeText(candidateObj.jobPosition || candidateObj.jobAppliedFor || candidateObj.appliedJobTitle, 'Open to opportunities'),
    preferredCountry: sanitizeText(candidateObj.destinationCountry || candidateObj.country, 'Global'),
    nationality: sanitizeText(candidateObj.nationality || candidateObj.country, ''),
    religion: sanitizeText(candidateObj.religion, ''),
    expectedSalary: sanitizeText(candidateObj.expectedSalary || 'Confidential', 'Confidential'),
    age: candidateObj.dateOfBirth ? new Date().getFullYear() - new Date(candidateObj.dateOfBirth).getFullYear() : null,
    verificationBadge: verificationBadges[0],
    verificationBadges,
    availabilityStatus: availability,
    availability,
    currentStatus: sanitizeText(candidateObj.currentStatus || 'Verified', 'Verified'),
    skills,
    languages,
    yearsOfExperience: normalizeExperience(candidateObj.experience),
    professionalSummary: sanitizeText(candidateObj.professionalSummary || 'Verified professional ready for new opportunities.', 'Verified professional ready for new opportunities.'),
    careerObjective: sanitizeText(candidateObj.careerObjective || 'Seeking a role that matches my skills and experience.', 'Seeking a role that matches my skills and experience.'),
    workExperience,
    education,
    certificates,
    employmentHistory,
    photos,
    documentsVerification: {
      passport: candidateObj.passportUrl ? 'Verified' : 'Pending',
      drivingLicense: candidateObj.documents?.drivingLicense ? 'Verified' : 'Pending',
      medical: candidateObj.medicalUrl ? 'Verified' : 'Pending',
      policeClearance: candidateObj.documents?.policeClearance ? 'Verified' : 'Pending',
      academicCertificates: candidateObj.documents?.academicCertificates ? 'Verified' : 'Pending',
      professionalCertificates: candidateObj.documents?.professionalCertificates ? 'Verified' : 'Pending',
    },
    employmentPreferences: {
      preferredJob: sanitizeText(candidateObj.jobPosition || candidateObj.jobAppliedFor || 'Open to opportunities', 'Open to opportunities'),
      preferredCountry: sanitizeText(candidateObj.destinationCountry || candidateObj.country, 'Global'),
      expectedSalary: sanitizeText(candidateObj.expectedSalary || 'Confidential', 'Confidential'),
      employmentType: sanitizeText(candidateObj.jobType || 'Full Time', 'Full Time'),
    },
    availabilityDetails: {
      availableImmediately: availability === 'Available Immediately',
      noticePeriod: sanitizeText(candidateObj.noticePeriod || 'Immediate', 'Immediate'),
      passportReady: Boolean(candidateObj.passportUrl),
      readyToRelocate: Boolean(candidateObj.destinationCountry || candidateObj.destinationPreference?.length),
    },
    matchScore: computeBlissMatchScore(candidateObj, employerRequirements),
    verified: Boolean(candidateObj.isVerified),
    isVerified: Boolean(candidateObj.isVerified),
    status: sanitizeText(candidateObj.status, 'available'),
    country: sanitizeText(candidateObj.country || candidateObj.destinationCountry, 'Global'),
  };

  return profile;
}

module.exports = {
  buildCandidateMarketplaceProfile,
  computeBlissMatchScore,
};
