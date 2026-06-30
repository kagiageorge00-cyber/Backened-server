// routes/register.js

const express = require("express");
const path = require("path");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Candidate = require("../models/candidate");
const { FRONTEND_URL } = require("../config");
const {
  notifyRegistrationSuccess,
  notifyMarketplaceListing,
} = require('../services/notificationservice');
const { notifyCandidateRegistered } = require('../utils/adminNotificationHelper');

// ======================
// 🔐 HELPERS
// ======================
function generatePassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function generateCandidateCode() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `CAND-${year}-${seq}`;
}

function toArrayField(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function calculateProfileCompletion(candidate) {
  const requiredFields = [
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

  const completedFields = requiredFields.filter((field) => {
    const value = candidate[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value != null && value !== '';
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
}

// ======================
// REGISTER ROUTE INFO
// ======================
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Use POST /api/register with candidate data to register a candidate.",
    requiredFields: [
      "fullName",
      "email",
      "phone",
      "country",
      "photoUrl",
      "videoUrl",
      "passportUrl",
      "medicalUrl",
      "conductUrl"
    ],
    optionalFields: [
      "resumeUrl",
      "additionalUrl"
    ],
  });
});

// ======================
// 🚀 REGISTER CANDIDATE
// ======================
router.post("/", async (req, res) => {
  try {
    const {
      fullName,
      email,
      country,
      nationality,
      religion,
      education,
      educationalLevel,
      experience,
      skills,
      languages,
      gender,
      dateOfBirth,
      maritalStatus,
      numberOfChildren,
      jobPosition,
      jobType,
      destinationCountry,
      destinationPreference,
      preferredDestination,
      preferredDestinations,
      expectedSalary,
      photoUrl,
      videoUrl,
      passportUrl,
      medicalUrl,
      conductUrl,
      resumeUrl,
      additionalUrl,
      jobAppliedFor,
      appliedJobId,
      appliedJobTitle,
      appliedEmployerId,
      appliedEmployerName,
    } = req.body;

    // normalize phone for lookup: strip spaces and non-digits, keep leading + if present
    let phone = req.body.phone || req.query.phone;
    const normalizePhone = (p) => {
      if (!p) return p;
      // remove spaces, dashes, parentheses and leading '#'
      return p.replace(/[#\s\-()]/g, '').trim();
    };
    phone = normalizePhone(phone);

    // ======================
    // CHECK EXISTING FIRST
    // ======================
    let candidate = await Candidate.findOne({ phone });

    // ======================
    // VALIDATION (allow existing candidate's stored docs)
    // ======================
    const requiredFields = [
      { key: 'phone', value: phone },
      { key: 'email', value: email },
    ];

    const looksLikeVideoFile = (str) => {
      if (!str || typeof str !== 'string') return false;
      const s = str.toLowerCase();
      return s.includes('.mp4') || s.includes('.mov') || s.includes('.mpeg') || s.includes('video');
    };

    const hasStored = (fieldKey) => {
      if (!candidate) return false;
      // direct fields
      const direct = candidate[fieldKey];
      if (direct && !(typeof direct === 'string' && !direct.trim())) return true;

      // check documents container
      if (candidate.documents) {
        if (fieldKey === 'passportUrl' && candidate.documents.passportPhoto) return true;
        if (fieldKey === 'resumeUrl' && candidate.documents.cv) return true;
        if (fieldKey === 'additionalUrl' && candidate.documents.coverLetter) return true;

        // check uploads array for matching filename or url
        if (Array.isArray(candidate.documents.uploads)) {
          const found = candidate.documents.uploads.find((u) => {
            if (!u) return false;
            if (u.filename && looksLikeVideoFile(u.filename)) return true;
            if (u.url && looksLikeVideoFile(u.url)) return true;
            return false;
          });
          if (found) return true;
        }
      }

      return false;
    };

    const missingField = requiredFields.find((field) => {
      const value = field.value;

      const isEmpty = value === undefined || value === null || (typeof value === 'string' && !value.trim());
      if (!isEmpty) return false; // present in request

      // if candidate exists, check if candidate already has this value stored or equivalent
      if (candidate) {
        if (hasStored(field.key)) return false;
        // special-case video: look for uploads that look like videos
        if (field.key === 'videoUrl' && hasStored('videoUrl')) return false;
      }

      return true; // missing both in request and stored candidate
    });

    if (missingField) {
      return res.status(400).json({
        success: false,
        error: `${missingField.key} is required`,
      });
    }
    let passwordPlain;
    let uniqueCode;
    
    if (candidate) {
      // Update only the uploaded documents and preserve existing profile data
      candidate.fullName = fullName || candidate.fullName;
      candidate.name = fullName || candidate.name;
      candidate.email = email || candidate.email;
      candidate.country = country || candidate.country;
      candidate.nationality = nationality || candidate.nationality;
      candidate.religion = religion || candidate.religion;
      candidate.education = education || candidate.education;
      candidate.educationalLevel = educationalLevel || candidate.educationalLevel;
      candidate.experience = experience || candidate.experience;
      candidate.skills = Array.isArray(skills)
        ? skills
        : skills
          ? toArrayField(skills)
          : candidate.skills;
      candidate.languages = Array.isArray(languages)
        ? languages
        : languages
          ? toArrayField(languages)
          : candidate.languages;
      candidate.gender = gender || candidate.gender;
      candidate.dateOfBirth = dateOfBirth || candidate.dateOfBirth;
      candidate.maritalStatus = maritalStatus || candidate.maritalStatus;
      candidate.numberOfChildren = numberOfChildren !== undefined ? numberOfChildren : candidate.numberOfChildren;
      candidate.jobPosition = jobPosition || candidate.jobPosition;
      candidate.jobType = jobType || candidate.jobType;
      candidate.destinationCountry = destinationCountry || candidate.destinationCountry;
      candidate.destinationPreference = destinationPreference || preferredDestination || preferredDestinations || candidate.destinationPreference;
      candidate.expectedSalary = expectedSalary || candidate.expectedSalary;
      candidate.photoUrl = photoUrl || candidate.photoUrl;
      candidate.videoUrl = videoUrl || candidate.videoUrl;
      candidate.passportUrl = passportUrl || candidate.passportUrl;
      candidate.medicalUrl = medicalUrl || candidate.medicalUrl;
      candidate.conductUrl = conductUrl || candidate.conductUrl;
      candidate.resumeUrl = resumeUrl || candidate.resumeUrl;
      candidate.additionalUrl = additionalUrl || candidate.additionalUrl;
      candidate.jobAppliedFor = jobAppliedFor || candidate.jobAppliedFor;
      candidate.appliedJobId = appliedJobId || candidate.appliedJobId;
      candidate.appliedJobTitle = appliedJobTitle || candidate.appliedJobTitle;
      candidate.appliedEmployerId = appliedEmployerId || candidate.appliedEmployerId;
      candidate.appliedEmployerName = appliedEmployerName || candidate.appliedEmployerName;
      candidate.uniqueCode = candidate.uniqueCode || generateCandidateCode();
      candidate.isVerified = candidate.isVerified || false;
      candidate.paymentStatus = candidate.paymentStatus === 'completed' ? 'completed' : 'pending';
      candidate.status = ['available', 'deployed'].includes(candidate.status)
        ? candidate.status
        : 'in_process';

      candidate.profileCompletion = calculateProfileCompletion(candidate);

      candidate.documents = {
        ...(candidate.documents || {}),
        passportPhoto: passportUrl || candidate.documents?.passportPhoto || candidate.passportUrl,
        cv: resumeUrl || candidate.documents?.cv || candidate.resumeUrl,
        coverLetter: additionalUrl || candidate.documents?.coverLetter || candidate.additionalUrl,
        certificates: candidate.documents?.certificates || [],
        uploads: candidate.documents?.uploads || [],
      };

      candidate.documents = {
        ...(candidate.documents || {}),
        passportPhoto: passportUrl || candidate.documents?.passportPhoto || candidate.passportUrl,
        cv: resumeUrl || candidate.documents?.cv || candidate.resumeUrl,
        coverLetter: additionalUrl || candidate.documents?.coverLetter || candidate.additionalUrl,
        certificates: candidate.documents?.certificates || [],
        uploads: candidate.documents?.uploads || [],
      };

      if (!candidate.password) {
        passwordPlain = `BLISS${Math.floor(1000 + Math.random() * 9000)}`;
        candidate.password = await bcrypt.hash(passwordPlain, 10);
      }

      await candidate.save();
    } else {
      // ======================
      // GENERATE CREDENTIALS
      // ======================
      // Temporary password format: BLISS####
      passwordPlain = `BLISS${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);
      uniqueCode = generateCandidateCode();

      const profileCompletionValue = calculateProfileCompletion({
        fullName,
        name: fullName,
        email,
        phone,
        country,
        nationality,
        religion,
        education,
        educationalLevel,
        experience,
        skills: Array.isArray(skills) ? skills : toArrayField(skills),
        languages: Array.isArray(languages) ? languages : toArrayField(languages),
        gender,
        dateOfBirth,
        maritalStatus,
        numberOfChildren,
        jobPosition,
        jobType,
        destinationCountry,
        destinationPreference: Array.isArray(destinationPreference)
          ? destinationPreference
          : toArrayField(destinationPreference || preferredDestination || preferredDestinations),
        expectedSalary,
        photoUrl,
        videoUrl,
        passportUrl,
        medicalUrl,
        conductUrl,
        resumeUrl,
        additionalUrl,
        jobAppliedFor,
        appliedJobId,
        appliedJobTitle,
        appliedEmployerId,
        appliedEmployerName,
      });

      // ======================
      // CREATE CANDIDATE
      // ======================
      candidate = await Candidate.create({
        fullName,
        name: fullName, // 🔥 matches your schema
        email,
        phone,
        country,
        nationality,
        religion,
        education,
        educationalLevel,
        experience,
        skills: Array.isArray(skills) ? skills : toArrayField(skills),
        languages: Array.isArray(languages) ? languages : toArrayField(languages),
        gender,
        dateOfBirth,
        maritalStatus,
        numberOfChildren,
        jobPosition,
        jobType,
        destinationCountry,
        destinationPreference: Array.isArray(destinationPreference)
          ? destinationPreference
          : toArrayField(destinationPreference || preferredDestination || preferredDestinations),
        expectedSalary,
        photoUrl,
        videoUrl,
        passportUrl,
        medicalUrl,
        conductUrl,
        resumeUrl,
        additionalUrl,
        jobAppliedFor,
        appliedJobId,
        appliedJobTitle,
        appliedEmployerId,
        appliedEmployerName,
        uniqueCode, // ✅ correct field (not candidateId)
        password: hashedPassword,
        profileCompletion: profileCompletionValue,
        documents: {
          passportPhoto: passportUrl || null,
          cv: resumeUrl || null,
          coverLetter: additionalUrl || null,
          certificates: [],
          uploads: [],
        },
        isVerified: false,
        paymentStatus: "pending",
        status: "in_process",
      });

      if (typeof candidate.save === 'function') {
        await candidate.save();
      }
    }

    const candidateCode = candidate.uniqueCode || uniqueCode;
    const baseFrontendUrl = FRONTEND_URL || '';
    const candidatePortalLink = `${baseFrontendUrl}/candidate-portal`;
    const marketplaceProfileLink = candidate.isVerified
      ? `${baseFrontendUrl}/marketplace?candidate=${encodeURIComponent(candidateCode)}`
      : null;

    // ======================
    // SEND EMAILS 📧 (BACKGROUND ONLY)
    // ======================
    setImmediate(async () => {
      try {
        await notifyRegistrationSuccess({
          email,
          name: fullName,
          uniqueCode: candidateCode,
          password: passwordPlain,
          candidatePortalLink,
          marketplaceProfileLink,
        });
      } catch (notificationError) {
        console.error('❌ notifyRegistrationSuccess failed:', notificationError);
      }
    });

    if (candidate.isVerified) {
      setImmediate(async () => {
        try {
          await notifyMarketplaceListing({
            email,
            name: fullName,
            uniqueCode: candidateCode,
            marketplaceProfileLink,
          });
        } catch (notificationError) {
          console.error('❌ notifyMarketplaceListing failed:', notificationError);
        }
      });
    }

    setImmediate(async () => {
      try {
        await notifyCandidateRegistered({
          candidateName: fullName || phone,
          phone,
          candidateCode,
          candidatePassword: passwordPlain,
          marketplaceLink: marketplaceProfileLink,
        });
      } catch (notificationError) {
        console.error('❌ notifyCandidateRegistered failed:', notificationError);
      }
    });

    // ======================
    // RESPONSE
    // ======================
    const resp = {
      success: true,
      message: 'Candidate registration submitted successfully. Complete payment to finish verification.',
      candidateId: candidateCode,
      data: candidate,
      candidatePortalLink,
    };

    if (marketplaceProfileLink) {
      resp.marketplaceProfileLink = marketplaceProfileLink;
    }

    // include plain password so frontend can display it once (only on create)
    if (passwordPlain) {
      resp.password = passwordPlain;
    }

    return res.status(201).json(resp);

  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Server error",
    });
  }
});

module.exports = router;