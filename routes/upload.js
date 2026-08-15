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
// STORAGE (Cloudinary when configured, otherwise local disk fallback)
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

function createDiskStorage() {
  return multer.diskStorage({
    destination(req, file, cb) {
      try {
        const relFolder = getUploadFolder(req) || 'bliss-connect';
        // Ensure folder is under backend/uploads/
        const uploadsRoot = path.join(__dirname, '..', 'uploads');
        const finalFolder = path.join(uploadsRoot, relFolder.replace(/^uploads\/?/, ''));
        fs.mkdirSync(finalFolder, { recursive: true });
        cb(null, finalFolder);
      } catch (err) {
        cb(err);
      }
    },
    filename(req, file, cb) {
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(/\s+/g, '_')}`;
      cb(null, safeName);
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
  const diskStorage = createDiskStorage();

  return {
    _handleFile(req, file, cb) {
      if (!isCloudinaryConfigured()) {
        return diskStorage._handleFile(req, file, cb);
      }

      try {
        const cloudStorage = createCloudinaryStorage();
        cloudStorage._handleFile(req, file, (err, info) => {
          if (err) {
            console.warn('Cloudinary upload failed, falling back to disk storage:', err && err.message ? err.message : err);
            return diskStorage._handleFile(req, file, cb);
          }
          cb(null, info);
        });
      } catch (err) {
        console.warn('Cloudinary storage init failed, falling back to disk storage:', err && err.message ? err.message : err);
        return diskStorage._handleFile(req, file, cb);
      }
    },
    _removeFile(req, file, cb) {
      if (diskStorage && typeof diskStorage._removeFile === 'function') {
        return diskStorage._removeFile(req, file, cb);
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

  let fileUrl = file.path || file.location || file.url || '';
  if (!/^https?:\/\//i.test(fileUrl)) {
    const filename = file.filename || path.basename(file.path || file.originalname || 'file');
    let relFolder = '';
    if (file.destination) {
      relFolder = path.relative(path.join(__dirname, '..', 'uploads'), file.destination).replace(/\\/g, '/').replace(/^\//, '');
    } else {
      relFolder = getUploadFolder(req).replace(/^uploads\/?/, '');
    }
    const folderSegment = relFolder ? `uploads/${relFolder}` : 'uploads';
    fileUrl = `${req.protocol}://${req.get('host')}/${folderSegment}/${filename}`;
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

module.exports = router;
module.exports.persistUploadToCandidate = persistUploadToCandidate;
module.exports.getUploadFolder = getUploadFolder;
module.exports.createAdaptiveStorage = createAdaptiveStorage;