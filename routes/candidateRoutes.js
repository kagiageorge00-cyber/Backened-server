const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const Candidate = require('../models/candidate');
const { sendEmail } = require('../email');
const { FRONTEND_URL } = require('../config');

const documentStorage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'candidate_documents');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// POST /login-id - authenticate using Candidate ID and password
router.post('/login-id', async (req, res) => {
  try {
    const { candidateId, password } = req.body;
    if (!candidateId || !password) {
      return res.status(400).json({ success: false, error: 'candidateId and password required' });
    }

    const candidate = await Candidate.findOne({ uniqueCode: candidateId });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const match = await bcrypt.compare(password, candidate.password || '');
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const responseCandidate = candidate.toObject ? candidate.toObject() : { ...candidate };
    if (responseCandidate.password) delete responseCandidate.password;

    return res.json({ success: true, user: responseCandidate });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

function generateCandidateCode() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `CAND-${year}-${seq}`;
}

function generateTemporaryPassword(length = 10) {
  // Use BLISS#### format for temporary passwords
  return `BLISS${Math.floor(1000 + Math.random() * 9000)}`;
}

function normalizeCandidate(candidate) {
  const candidateObj = candidate.toObject ? candidate.toObject() : { ...candidate };
  const birthDate = candidateObj.dateOfBirth ? new Date(candidateObj.dateOfBirth) : null;
  const age = birthDate && !Number.isNaN(birthDate.getTime())
    ? new Date().getFullYear() - birthDate.getFullYear()
    : null;
  return {
    _id: candidateObj._id,
    uniqueCode: candidateObj.uniqueCode || candidateObj.candidateId || (candidateObj._id ? candidateObj._id.toString() : null),
    candidateId: candidateObj.candidateId || candidateObj.uniqueCode || (candidateObj._id ? candidateObj._id.toString() : null),
    name: candidateObj.fullName || candidateObj.name,
    fullName: candidateObj.fullName || candidateObj.name,
    email: candidateObj.email,
    phone: candidateObj.phone,
    country: candidateObj.country,
    nationality: candidateObj.nationality,
    religion: candidateObj.religion,
    education: candidateObj.education,
    educationalLevel: candidateObj.educationalLevel,
    experience: candidateObj.experience,
    skills: candidateObj.skills || [],
    languages: candidateObj.languages || [],
    age,
    gender: candidateObj.gender,
    status: candidateObj.status,
    availability: candidateObj.status === 'available' ? 'Available' : candidateObj.status,
    currentStatus: candidateObj.currentStatus,
    paymentStatus: candidateObj.paymentStatus,
    profileCompletion: candidateObj.profileCompletion || 0,
    profilePhoto: candidateObj.profilePhoto || candidateObj.photoUrl,
    photoUrl: candidateObj.photoUrl || candidateObj.profilePhoto,
    videoUrl: candidateObj.videoUrl,
    passportUrl: candidateObj.passportUrl,
    medicalUrl: candidateObj.medicalUrl,
    resumeUrl: candidateObj.resumeUrl,
    additionalUrl: candidateObj.additionalUrl,
    jobType: candidateObj.jobType,
    destinationPreference: candidateObj.destinationPreference || candidateObj.preferredDestination || candidateObj.preferredDestinations || null,
    documents: candidateObj.documents || { certificates: [], uploads: [] },
    createdAt: candidateObj.createdAt,
  };
}

function buildMarketplaceCandidate(candidate) {
  const candidateObj = normalizeCandidate(candidate);
  const experience = candidateObj.experience || '';
  const experienceLabel = typeof experience === 'string' && experience.trim().length > 0
    ? experience
    : experience !== undefined && experience !== null
      ? `${experience} Years`
      : null;
  const languages = Array.isArray(candidateObj.languages) ? candidateObj.languages : [];
  const skills = Array.isArray(candidateObj.skills) ? candidateObj.skills : [];
  const destination = Array.isArray(candidateObj.destinationPreference)
    ? candidateObj.destinationPreference.join(', ')
    : candidateObj.destinationPreference || null;

  return {
    candidateId: candidateObj.candidateId,
    name: candidateObj.name,
    fullName: candidateObj.fullName,
    age: candidateObj.age,
    ageLabel: candidateObj.age !== null ? `${candidateObj.age} Years` : null,
    nationality: candidateObj.nationality,
    religion: candidateObj.religion,
    experience: experienceLabel,
    languages: languages,
    languagesLabel: languages.length > 0 ? languages.join(', ') : null,
    skills: skills,
    skillsLabel: skills.length > 0 ? skills.join(', ') : null,
    education: candidateObj.education || candidateObj.educationalLevel,
    destinationPreference: destination,
    availability: candidateObj.status === 'available' ? 'Available ✔' : candidateObj.status || 'Unavailable',
    photoUrl: candidateObj.photoUrl,
    profileCompletion: candidateObj.profileCompletion,
    currentStatus: candidateObj.currentStatus,
    status: candidateObj.status,
  };
}

// GET /
router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: candidates.length,
      data: candidates.map(normalizeCandidate),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /marketplace
router.get('/marketplace', async (req, res) => {
  try {
    const candidates = await Candidate.find({ isVerified: true, status: 'available' }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: candidates.length,
      data: candidates.map(buildMarketplaceCandidate),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /marketplace/profile/:candidateId
router.get('/marketplace/profile/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required' });
    }

    const searchCriteria = [];
    if (mongoose.Types.ObjectId.isValid(candidateId)) {
      searchCriteria.push({ _id: candidateId });
    }
    searchCriteria.push(
      { uniqueCode: candidateId },
      { candidateId },
      { phone: candidateId },
      { email: candidateId }
    );

    const candidate = await Candidate.findOne({
      $or: searchCriteria,
      isVerified: true,
      status: 'available',
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.json({
      success: true,
      data: buildMarketplaceCandidate(candidate),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /deployed
router.get('/deployed', async (req, res) => {
  try {
    const candidates = await Candidate.find({ status: 'deployed' }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: candidates.length,
      data: candidates.map(normalizeCandidate),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /form/data
router.get('/form/data', async (req, res) => {
  try {
    const { candidateId, phone } = req.query;
    const lookupValue = candidateId || phone;

    if (!lookupValue) {
      return res.status(400).json({ success: false, error: 'candidateId or phone query parameter required' });
    }

    const searchCriteria = [];
    if (mongoose.Types.ObjectId.isValid(lookupValue)) {
      searchCriteria.push({ _id: lookupValue });
    }

    searchCriteria.push(
      { uniqueCode: lookupValue },
      { phone: lookupValue },
      { email: lookupValue }
    );

    const candidate = await Candidate.findOne({ $or: searchCriteria });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const candidateData = candidate.toObject ? candidate.toObject() : candidate;
    candidateData.candidateId = candidate.uniqueCode;
    candidateData.id = candidate.uniqueCode;

    return res.json({
      success: true,
      lookup: {
        by: candidateId ? 'candidateId' : 'phone',
        value: lookupValue
      },
      candidateId: candidate.uniqueCode,
      data: candidateData,
      formLink: `${FRONTEND_URL}/candidate-form?phone=${candidate.phone}`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /form/submit
router.post('/form/submit', async (req, res) => {
  try {
    const {
      candidateId,
      phone,
      fullName,
      email,
      country,
      nationality,
      religion,
      education,
      skills,
      languages,
      experience,
      gender,
      dateOfBirth,
      maritalStatus,
      jobType,
      destinationPreference,
      preferredDestination,
      preferredDestinations,
      currentStatus,
      photoUrl,
      videoUrl,
      passportUrl,
      medicalUrl,
      resumeUrl,
      additionalUrl,
      paymentId,
    } = req.body;

    const requiredFields = [
      { key: 'fullName', value: fullName },
      { key: 'email', value: email },
      { key: 'phone', value: phone },
      { key: 'country', value: country },
      { key: 'skills', value: skills },
      { key: 'experience', value: experience },
      { key: 'photoUrl', value: photoUrl },
      { key: 'videoUrl', value: videoUrl },
      { key: 'passportUrl', value: passportUrl },
      { key: 'medicalUrl', value: medicalUrl },
      { key: 'resumeUrl', value: resumeUrl },
    ];

    const missingField = requiredFields.find((field) => {
      const value = field.value;
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });

    if (missingField) {
      return res.status(400).json({
        success: false,
        error: `${missingField.key} is required`,
      });
    }

    const lookupValue = candidateId || phone;
    if (!lookupValue) {
      return res.status(400).json({ success: false, error: 'candidateId or phone is required' });
    }

    const searchCriteria = [];
    if (mongoose.Types.ObjectId.isValid(lookupValue)) {
      searchCriteria.push({ _id: lookupValue });
    }

    searchCriteria.push(
      { uniqueCode: lookupValue },
      { phone: lookupValue },
      { email: lookupValue }
    );

    let candidate = await Candidate.findOne({ $or: searchCriteria });
    let passwordPlain;

    if (!candidate) {
      passwordPlain = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);

      const createObj = {
        fullName,
        name: fullName,
        email,
        phone,
        country,
        nationality,
        religion,
        education,
        skills,
        languages,
        experience,
        gender,
        dateOfBirth,
        maritalStatus,
        jobType,
        destinationPreference: destinationPreference || preferredDestination || preferredDestinations || [],
        currentStatus,
        photoUrl,
        videoUrl,
        passportUrl,
        medicalUrl,
        resumeUrl,
        additionalUrl,
        uniqueCode: generateCandidateCode(),
        password: hashedPassword,
        isVerified: true,
        status: 'available',
        paymentStatus: 'completed',
        documents: {
          passportPhoto: passportUrl || null,
          nationalId: null,
          cv: resumeUrl || null,
          certificates: [],
          coverLetter: null,
          uploads: [],
        },
      };

      if (paymentId) createObj.paymentId = paymentId;

      candidate = await Candidate.create(createObj);
    } else {
      candidate.uniqueCode = candidate.uniqueCode || generateCandidateCode();

      if (!candidate.password) {
        passwordPlain = generateTemporaryPassword();
        candidate.password = await bcrypt.hash(passwordPlain, 10);
      }

      candidate.fullName = fullName || candidate.fullName;
      candidate.name = fullName || candidate.name;
      candidate.email = email || candidate.email;
      candidate.phone = phone || candidate.phone;
      candidate.country = country || candidate.country;
      candidate.nationality = nationality || candidate.nationality;
      candidate.religion = religion || candidate.religion;
      candidate.education = education || candidate.education;
      candidate.skills = skills || candidate.skills;
      candidate.languages = languages || candidate.languages;
      candidate.experience = experience || candidate.experience;
      candidate.gender = gender || candidate.gender;
      candidate.dateOfBirth = dateOfBirth || candidate.dateOfBirth;
      candidate.maritalStatus = maritalStatus || candidate.maritalStatus;
      candidate.jobType = jobType || candidate.jobType;
      candidate.destinationPreference = destinationPreference || preferredDestination || preferredDestinations || candidate.destinationPreference;
      candidate.currentStatus = currentStatus || candidate.currentStatus;
      candidate.photoUrl = photoUrl || candidate.photoUrl;
      candidate.videoUrl = videoUrl || candidate.videoUrl;
      candidate.passportUrl = passportUrl || candidate.passportUrl;
      candidate.medicalUrl = medicalUrl || candidate.medicalUrl;
      candidate.resumeUrl = resumeUrl || candidate.resumeUrl;
      candidate.additionalUrl = additionalUrl || candidate.additionalUrl;
      candidate.documents = {
        ...(candidate.documents || {}),
        passportPhoto: passportUrl || candidate.documents?.passportPhoto || candidate.passportUrl,
        cv: resumeUrl || candidate.documents?.cv || candidate.resumeUrl,
        certificates: candidate.documents?.certificates || [],
        nationalId: candidate.documents?.nationalId || null,
        coverLetter: candidate.documents?.coverLetter || null,
        uploads: candidate.documents?.uploads || [],
      };
      candidate.isVerified = true;
      candidate.status = 'available';
      candidate.paymentStatus = 'completed';
      if (paymentId) {
        candidate.paymentId = paymentId;
        try {
          const PaymentModel = require('../models/Payment');
          const pay = await PaymentModel.findById(paymentId);
          if (pay) {
            pay.formLink = pay.formLink || `${FRONTEND_URL}/#/candidate-form/${pay._id}`;
            await pay.save();
          }
        } catch (err) {
          console.warn('Could not link payment to candidate:', err.message || err);
        }
      }

      await candidate.save();
    }

    if (candidate.email) {
      const confirmationLink = `${FRONTEND_URL}/candidate-form?phone=${encodeURIComponent(candidate.phone)}`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4CAF50;">Registration Completed ✅</h2>
          <p>Hello ${candidate.fullName || 'Candidate'},</p>
          <p>Your candidate registration is now complete.</p>
          <p><strong>Candidate ID:</strong> ${candidate.uniqueCode || 'N/A'}</p>
          ${passwordPlain ? `<p><strong>Password:</strong> ${passwordPlain}</p>` : ''}
          <p><strong>Phone:</strong> ${candidate.phone || 'N/A'}</p>
          <p><a href="${confirmationLink}" style="display: inline-block; background-color: #4CAF50; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px;">Continue to Candidate Form</a></p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p><a href="${confirmationLink}">${confirmationLink}</a></p>
          <p style="color: #777; font-size: 13px;">Bliss Connect Team</p>
        </div>
      `;

      await sendEmail(
        candidate.email,
        'Candidate Registration Completed ✅',
        `Hello ${candidate.fullName || 'Candidate'},\n\nYour candidate registration is complete. Your Candidate ID is ${candidate.uniqueCode}.` +
          (passwordPlain ? ` Your password is ${passwordPlain}.` : ''),
        htmlBody
      );
    }

    const responseCandidate = candidate.toObject ? candidate.toObject() : { ...candidate };
    if (responseCandidate.password) {
      delete responseCandidate.password;
    }

    const responsePayload = {
      success: true,
      message: 'Candidate registration completed successfully',
      candidateId: candidate.uniqueCode,
      data: responseCandidate,
    };

    if (passwordPlain) {
      responsePayload.password = passwordPlain;
    }

    return res.json(responsePayload);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /documents
router.get('/documents', async (req, res) => {
  try {
    const candidateId = req.query.candidateId || req.query.id;
    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId query parameter is required' });
    }

    const searchCriteria = [];
    if (mongoose.Types.ObjectId.isValid(candidateId)) {
      searchCriteria.push({ _id: candidateId });
    }

    searchCriteria.push(
      { uniqueCode: candidateId },
      { phone: candidateId },
      { email: candidateId }
    );

    const candidate = await Candidate.findOne({ $or: searchCriteria });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.json({ success: true, data: candidate.documents || [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /uploadDocument
router.post('/uploadDocument', documentUpload.single('file'), async (req, res) => {
  try {
    const candidateId = req.body.candidateId || req.body.id;
    const documentType = req.body.documentType || req.body.type || 'other';

    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file is required' });
    }

    const searchCriteria = [];
    if (mongoose.Types.ObjectId.isValid(candidateId)) {
      searchCriteria.push({ _id: candidateId });
    }
    searchCriteria.push(
      { uniqueCode: candidateId },
      { phone: candidateId },
      { email: candidateId }
    );

    const candidate = await Candidate.findOne({ $or: searchCriteria });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/candidate_documents/${req.file.filename}`;

    candidate.documents = {
      ...(candidate.documents || {}),
      uploads: candidate.documents?.uploads || [],
    };

    if (documentType === 'passportPhoto') {
      candidate.documents.passportPhoto = fileUrl;
    } else if (documentType === 'nationalId') {
      candidate.documents.nationalId = fileUrl;
    } else if (documentType === 'cv') {
      candidate.documents.cv = fileUrl;
    } else if (documentType === 'coverLetter') {
      candidate.documents.coverLetter = fileUrl;
    } else if (documentType === 'certificates') {
      candidate.documents.certificates = [
        ...(candidate.documents.certificates || []),
        fileUrl,
      ];
    } else {
      candidate.documents.uploads.push({
        type: documentType,
        filename: req.file.originalname,
        url: fileUrl,
      });
    }

    await candidate.save();

    return res.json({ success: true, data: candidate.documents });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /upload-documents alias
router.post('/upload-documents', documentUpload.single('file'), async (req, res) => {
  try {
    const candidateId = req.body.candidateId || req.body.id;
    const documentType = req.body.documentType || req.body.type || 'other';

    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'candidateId is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file is required' });
    }

    const searchCriteria = [];
    if (mongoose.Types.ObjectId.isValid(candidateId)) {
      searchCriteria.push({ _id: candidateId });
    }
    searchCriteria.push({
      uniqueCode: candidateId,
      phone: candidateId,
      email: candidateId,
    });

    const candidate = await Candidate.findOne({ $or: searchCriteria });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/candidate_documents/${req.file.filename}`;

    candidate.documents = {
      ...(candidate.documents || {}),
      uploads: candidate.documents?.uploads || [],
    };

    if (documentType === 'passportPhoto') {
      candidate.documents.passportPhoto = fileUrl;
    } else if (documentType === 'nationalId') {
      candidate.documents.nationalId = fileUrl;
    } else if (documentType === 'cv') {
      candidate.documents.cv = fileUrl;
    } else if (documentType === 'coverLetter') {
      candidate.documents.coverLetter = fileUrl;
    } else if (documentType === 'certificates') {
      candidate.documents.certificates = [
        ...(candidate.documents.certificates || []),
        fileUrl,
      ];
    } else {
      candidate.documents.uploads.push({
        type: documentType,
        filename: req.file.originalname,
        url: fileUrl,
      });
    }

    await candidate.save();

    return res.json({ success: true, data: candidate.documents });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const searchCriteria = [];

    if (mongoose.Types.ObjectId.isValid(id)) {
      searchCriteria.push({ _id: id });
    }

    searchCriteria.push(
      { uniqueCode: id },
      { phone: id },
      { email: id }
    );

    const candidate = await Candidate.findOne({ $or: searchCriteria });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.json({ success: true, data: candidate });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /:id/documents
router.put('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      photoUrl,
      videoUrl,
      passportUrl,
      medicalUrl,
      resumeUrl,
      additionalUrl,
      documents = {},
    } = req.body;

    const searchCriteria = [];
    if (mongoose.Types.ObjectId.isValid(id)) {
      searchCriteria.push({ _id: id });
    }

    searchCriteria.push(
      { uniqueCode: id },
      { phone: id },
      { email: id }
    );

    const candidate = await Candidate.findOne({ $or: searchCriteria });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    if (photoUrl !== undefined) candidate.photoUrl = photoUrl;
    if (videoUrl !== undefined) candidate.videoUrl = videoUrl;
    if (passportUrl !== undefined) candidate.passportUrl = passportUrl;
    if (medicalUrl !== undefined) candidate.medicalUrl = medicalUrl;
    if (resumeUrl !== undefined) candidate.resumeUrl = resumeUrl;
    if (additionalUrl !== undefined) candidate.additionalUrl = additionalUrl;

    candidate.documents = {
      ...(candidate.documents || {}),
      passportPhoto: documents.passportPhoto ?? candidate.documents?.passportPhoto,
      nationalId: documents.nationalId ?? candidate.documents?.nationalId,
      cv: documents.cv ?? candidate.documents?.cv ?? candidate.resumeUrl,
      certificates: documents.certificates ?? candidate.documents?.certificates ?? [],
      coverLetter: documents.coverLetter ?? candidate.documents?.coverLetter,
      uploads: candidate.documents?.uploads ?? [],
    };

    await candidate.save();

    return res.json({ success: true, data: candidate });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      fullName: req.body.fullName,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      country: req.body.country,
      skills: req.body.skills,
      experience: req.body.experience,
      status: req.body.status,
      paymentStatus: req.body.paymentStatus,
      uniqueCode: req.body.uniqueCode,
      password: req.body.password,
      isVerified: req.body.isVerified,
      photoUrl: req.body.photoUrl,
      videoUrl: req.body.videoUrl,
      passportUrl: req.body.passportUrl,
      medicalUrl: req.body.medicalUrl,
      resumeUrl: req.body.resumeUrl,
      additionalUrl: req.body.additionalUrl,
    };

    const validUpdates = Object.keys(updates).reduce((acc, key) => {
      if (updates[key] !== undefined) {
        acc[key] = updates[key];
      }
      return acc;
    }, {});

    const searchCriteria = [];
    if (mongoose.Types.ObjectId.isValid(id)) {
      searchCriteria.push({ _id: id });
    }

    searchCriteria.push(
      { uniqueCode: id },
      { phone: id },
      { email: id }
    );

    const candidate = await Candidate.findOneAndUpdate(
      { $or: searchCriteria },
      { $set: validUpdates },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.json({ success: true, data: candidate });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const searchCriteria = [];

    if (mongoose.Types.ObjectId.isValid(id)) {
      searchCriteria.push({ _id: id });
    }

    searchCriteria.push(
      { uniqueCode: id },
      { phone: id },
      { email: id }
    );

    const candidate = await Candidate.findOneAndDelete({ $or: searchCriteria });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
