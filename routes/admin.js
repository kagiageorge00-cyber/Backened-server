console.log("🔥🔥🔥 ADMIN ROUTES FILE LOADED 🔥🔥🔥");


const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

// 🔥 IMPORTANT: Use SAME model name as server
const User = mongoose.model("User");

// ======================
// TEST ROUTE (VERY IMPORTANT)
// ======================
router.get("/test", (req, res) => {
  res.json({ message: "Admin route working ✅" });
});

// ======================
// GET ALL CANDIDATES
// ======================
router.get("/candidates", async (req, res) => {
  console.log("/api/admin/candidates endpoint hit");
  try {
    const candidates = await User.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: candidates,
    });
  } catch (err) {
    console.error("❌ GET CANDIDATES ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ======================
// VERIFY USER
// ======================
router.post("/verify-user", async (req, res) => {
  try {
    const { phone } = req.body;

    await User.findOneAndUpdate(
      { phone },
      { isVerified: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// ======================
// UPDATE STATUS
// ======================
router.post("/status", async (req, res) => {
  try {
    const { phone, status } = req.body;

    await User.findOneAndUpdate(
      { phone },
      { status }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ STATUS ERROR:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;