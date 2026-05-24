const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ----------------------
// DATABASE CONNECTION
// ----------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ----------------------
// MODELS
// ----------------------
const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  userType: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const medicalSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  fullName: String,
  phone: String,
  amount: { type: Number, default: 7500 },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const Medical = mongoose.model('Medical', medicalSchema);

// ----------------------
// FILE UPLOAD (multer)
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ----------------------
// ROUTES
// ----------------------

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend running 🚀' });
});

// Register
app.post('/register', async (req, res) => {
  try {
    const { name, phone, userType } = req.body;

    if (!name || !phone || !userType) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = new User({ name, phone, userType });
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book medical
app.post('/medical/book', async (req, res) => {
  try {
    const { userId, fullName, phone } = req.body;

    const booking = new Medical({
      userId,
      fullName,
      phone
    });

    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload payment proof
app.post('/medical/upload/:id', upload.single('file'), async (req, res) => {
  try {
    const booking = await Medical.findById(req.params.id);

    if (!booking) return res.status(404).json({ error: 'Not found' });

    booking.proof = req.file.filename;
    booking.status = 'pending_verification';

    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});