const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require('path');
const fs = require('fs');
const Candidate = require("../models/candidate");

// ========================
// CLOUDINARY CONFIG
// ========================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ========================
// STORAGE (all uploads must be stored in Cloudinary)
// ========================
function createCloudinaryStorage() {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const qtype = (req.query && req.query.type) || (req.body && req.body.type);
      const candidateId = (req.query && req.query.candidateId) || (req.body && req.body.candidateId);
      const explicitFolder = (req.query && req.query.folder) || (req.body && req.body.folder);

      let folder = 'bliss-connect';
      if (explicitFolder) {
        folder = explicitFolder;
      } else if (qtype === 'candidate_video') {
        folder = candidateId ? `uploads/candidate_videos/${candidateId}` : 'uploads/candidate_videos';
      } else if (qtype === 'marketplace_job') {
        folder = 'uploads/marketplace_jobs';
      }

      return {
        folder,
        resource_type: 'auto',
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      };
    },
  });
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function createAdaptiveStorage() {
  const cloudStorage = createCloudinaryStorage();

  return {
    _handleFile(req, file, cb) {
      if (!isCloudinaryConfigured()) {
        return cb(new Error('Cloudinary is not configured'));
      }

      return cloudStorage._handleFile(req, file, cb);
    },
    _removeFile(req, file, cb) {
      if (typeof cloudStorage._removeFile === 'function') {
        return cloudStorage._removeFile(req, file, cb);
      }
      cb(null);
    },
  };
}

function chooseStorage() {
  return createAdaptiveStorage();
}

const upload = multer({
  storage: chooseStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

function getUploadFolder(req) {
  const qtype = (req.query && req.query.type) || (req.body && req.body.type);
  const candidateId = (req.query && req.query.candidateId) || (req.body && req.body.candidateId);
  const explicitFolder = (req.query && req.query.folder) || (req.body && req.body.folder);

  if (explicitFolder) {
    return explicitFolder;
  }

  if (qtype === 'candidate_video') {
    return candidateId ? `uploads/candidate_videos/${candidateId}` : 'uploads/candidate_videos';
  }

  if (qtype === 'marketplace_job') {
    return 'uploads/marketplace_jobs';
  }

  return 'bliss-connect';
}

function buildCandidateSearchCriteria(candidateId) {
  if (!candidateId) return [];

  const criteria = [];
  if (candidateId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(candidateId)) {
    criteria.push({ _id: candidateId });
  }
  criteria.push({ uniqueCode: candidateId }, { phone: candidateId }, { email: candidateId });
  return criteria;
}

async function persistUploadToCandidate({ candidateId, field, fileUrl, originalName }) {
  if (!candidateId || !fileUrl) return null;

  const criteria = buildCandidateSearchCriteria(candidateId);
  if (criteria.length === 0) return null;

  const candidate = await Candidate.findOne({ $or: criteria });
  if (!candidate) return null;

  candidate.documents = {
    ...(candidate.documents || {}),
    uploads: candidate.documents?.uploads || [],
  };

  const normalizedField = (field || '').toString().toLowerCase();

  if (['photo', 'photourl', 'profilephoto'].includes(normalizedField)) {
    candidate.photoUrl = fileUrl;
    candidate.documents.profilePhoto = fileUrl;
  } else if (['resume', 'resumeurl', 'cv'].includes(normalizedField)) {
    candidate.resumeUrl = fileUrl;
    candidate.documents.cv = fileUrl;
  } else if (['passport', 'passporturl', 'passportphoto'].includes(normalizedField)) {
    candidate.passportUrl = fileUrl;
    candidate.documents.passportPhoto = fileUrl;
  } else if (['medical', 'medicalurl'].includes(normalizedField)) {
    candidate.medicalUrl = fileUrl;
  } else if (['goodconduct', 'goodconducturl', 'conduct', 'conducturl'].includes(normalizedField)) {
    candidate.goodConductUrl = fileUrl;
  } else if (['videourl', 'video', 'introvideo', 'introductionvideo'].includes(normalizedField)) {
    candidate.videoUrl = fileUrl;
    candidate.introductionVideoUrl = fileUrl;
  } else if (['otherdocument', 'otherdocumenturl'].includes(normalizedField)) {
    candidate.otherDocumentUrl = fileUrl;
  } else if (['nationalidfront', 'nationalidfronturl'].includes(normalizedField)) {
    candidate.nationalIdFrontUrl = fileUrl;
  } else if (['nationalidback', 'nationalidbackurl'].includes(normalizedField)) {
    candidate.nationalIdBackUrl = fileUrl;
  } else if (['certificate', 'certificates'].includes(normalizedField)) {
    candidate.documents.certificates = [
      ...(candidate.documents.certificates || []),
      fileUrl,
    ];
  } else {
    candidate.documents.uploads.push({
      type: field || 'upload',
      filename: originalName || '',
      url: fileUrl,
    });
  }

  await candidate.save();
  return candidate;
}

function getLocalUploadPath(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return null;

  let pathname = fileUrl;
  try {
    pathname = new URL(fileUrl, 'http://localhost').pathname;
  } catch (error) {
    return null;
  }

  if (!pathname.startsWith('/uploads/')) return null;

  const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
  const localPath = path.resolve(uploadsRoot, decodeURIComponent(pathname.slice('/uploads/'.length)));
  if (localPath !== uploadsRoot && !localPath.startsWith(`${uploadsRoot}${path.sep}`)) return null;
  return localPath;
}

async function migrateCandidateLocalUploads(candidateId) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const criteria = buildCandidateSearchCriteria(candidateId);
  if (criteria.length === 0) return null;

  const candidate = await Candidate.findOne({ $or: criteria });
  if (!candidate) return null;

  const migrated = [];
  const urlCache = new Map();
  const migrateUrl = async (value, field) => {
    const localPath = getLocalUploadPath(value);
    if (!localPath) return value;
    if (!(await fs.promises.stat(localPath).catch(() => false))) return value;

    if (!urlCache.has(value)) {
      const result = await cloudinary.uploader.upload(localPath, {
        folder: 'bliss-connect/migrated-uploads',
        resource_type: 'auto',
      });
      if (!result.secure_url) throw new Error(`Cloudinary returned no URL for ${field}`);
      urlCache.set(value, result.secure_url);
      migrated.push({ field, oldUrl: value, url: result.secure_url });
    }
    return urlCache.get(value);
  };

  const candidateFields = [
    'photoUrl', 'videoUrl', 'passportUrl', 'medicalUrl', 'resumeUrl',
    'additionalUrl', 'goodConductUrl', 'introductionVideoUrl', 'otherDocumentUrl',
    'nationalIdFrontUrl', 'nationalIdBackUrl',
  ];
  for (const field of candidateFields) {
    candidate[field] = await migrateUrl(candidate[field], field);
  }

  if (candidate.documents) {
    for (const field of ['passportPhoto', 'nationalId', 'cv', 'coverLetter']) {
      candidate.documents[field] = await migrateUrl(candidate.documents[field], `documents.${field}`);
    }
    if (Array.isArray(candidate.documents.certificates)) {
      candidate.documents.certificates = await Promise.all(
        candidate.documents.certificates.map((url) => migrateUrl(url, 'documents.certificates'))
      );
    }
    if (Array.isArray(candidate.documents.uploads)) {
      for (const item of candidate.documents.uploads) {
        item.url = await migrateUrl(item.url, `documents.uploads.${item.filename || item.type || 'file'}`);
      }
    }
    candidate.markModified?.('documents');
  }

  if (migrated.length > 0) await candidate.save();
  return { candidate, migrated };
}

async function handleUploadRequest(req, res) {
  const file = req.file || (Array.isArray(req.files) && req.files[0]);
  if (!file) {
    return res.status(400).json({
      success: false,
      error: "No file uploaded",
    });
  }

  const candidateId = (req.body && (req.body.candidateId || req.body.id)) || (req.query && (req.query.candidateId || req.query.id));
  const field = (req.body && (req.body.field || req.body.documentType || req.body.type)) || (req.query && (req.query.field || req.query.documentType || req.query.type));

  const fileUrl = file.secure_url || file.path || file.location || file.url || '';
  if (!/^https?:\/\//i.test(fileUrl)) {
    return res.status(502).json({
      success: false,
      error: 'Cloudinary did not return a preview URL',
    });
  }

  let persistedCandidate = null;
  if (candidateId) {
    persistedCandidate = await persistUploadToCandidate({
      candidateId,
      field,
      fileUrl,
      originalName: file.originalname,
    });
  }

  return res.status(200).json({
    success: true,
    url: fileUrl,
    previewUrl: fileUrl,
    fileName: file.filename || file.originalname,
    persisted: Boolean(persistedCandidate),
    candidateId: candidateId || null,
  });
}

// ========================
// UPLOAD ROUTE
// ========================
router.post("/", (req, res, next) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      console.error("❌ Upload middleware error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || String(err),
      });
    }

    try {
      await handleUploadRequest(req, res);
    } catch (handlerError) {
      console.error("❌ Upload handler error:", handlerError);
      return res.status(500).json({
        success: false,
        error: handlerError.message || String(handlerError),
      });
    }
  });
});

router.post('/migrate-local', async (req, res) => {
  try {
    const candidateId = (req.body && (req.body.candidateId || req.body.id)) || (req.query && (req.query.candidateId || req.query.id));
    if (!candidateId) return res.status(400).json({ success: false, error: 'candidateId is required' });

    const result = await migrateCandidateLocalUploads(candidateId);
    if (!result) return res.status(404).json({ success: false, error: 'Candidate not found' });

    return res.json({
      success: true,
      migrated: result.migrated,
      urls: result.migrated.map((item) => item.url),
    });
  } catch (error) {
    console.error('Local upload migration error:', error);
    return res.status(500).json({ success: false, error: error.message || String(error) });
  }
});

module.exports = router;
module.exports.persistUploadToCandidate = persistUploadToCandidate;
module.exports.getUploadFolder = getUploadFolder;
module.exports.createAdaptiveStorage = createAdaptiveStorage;
module.exports.migrateCandidateLocalUploads = migrateCandidateLocalUploads;