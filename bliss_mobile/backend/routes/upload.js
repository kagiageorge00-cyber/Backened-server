const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

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

// ========================
// UPLOAD ROUTE
// ========================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    return res.status(200).json({
      success: true,
      url: req.file.path,
      fileName: req.file.filename,
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