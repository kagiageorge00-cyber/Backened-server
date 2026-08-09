const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
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
// STORAGE
// ========================
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Allow callers to specify a folder or type for organization.
    // Example: ?type=candidate_video&candidateId=CAND-2026-0045
    const qtype = (req.query && req.query.type) || (req.body && req.body.type);
    const candidateId = (req.query && req.query.candidateId) || (req.body && req.body.candidateId);
    let folder = 'bliss-connect';
    if (qtype === 'candidate_video') {
      folder = candidateId ? `uploads/candidate_videos/${candidateId}` : 'uploads/candidate_videos';
    } else if (req.query && req.query.folder) {
      folder = req.query.folder;
    }

    return {
      folder,
      resource_type: 'auto', // images, pdfs, videos
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

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

// ========================
// UPLOAD ROUTE
// ========================
router.post("/", upload.any(), async (req, res) => {
  try {
    const file = req.file || (Array.isArray(req.files) && req.files[0]);
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const candidateId = (req.body && (req.body.candidateId || req.body.id)) || (req.query && (req.query.candidateId || req.query.id));
    const field = (req.body && (req.body.field || req.body.documentType || req.body.type)) || (req.query && (req.query.field || req.query.documentType || req.query.type));

    let persistedCandidate = null;
    if (candidateId) {
      persistedCandidate = await persistUploadToCandidate({
        candidateId,
        field,
        fileUrl: file.path,
        originalName: file.originalname,
      });
    }

    return res.status(200).json({
      success: true,
      url: file.path,
      fileName: file.filename,
      persisted: Boolean(persistedCandidate),
      candidateId: candidateId || null,
    });

  } catch (err) {
    console.error("❌ Upload error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;