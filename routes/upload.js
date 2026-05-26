const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // ✅ MUST BE THIS
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ROUTE
router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    res.json({
      success: true,
      url: `/uploads/${req.file.filename}`, // ✅ IMPORTANT
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
res.json({
  success: true,
  url: `http://102.0.16.208:3000/uploads/${req.file.filename}`,
});

module.exports = router;