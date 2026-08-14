const express = require('express');
const router = express.Router();
const {
  submitMedicalBooking,
  getCandidateMedicalBookings,
  getPendingMedicalBookings,
  approveMedicalBooking,
  rejectMedicalBooking,
  getMedicalBookingById,
  getMedicalBookingStats,
} = require('../controllers/medicalController');

// Health check
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Medical Booking API running.' });
});

// Candidate routes
router.post('/booking', submitMedicalBooking);
router.get('/bookings/:candidateId', getCandidateMedicalBookings);
router.get('/booking/:bookingId', getMedicalBookingById);

// Admin routes
router.get('/admin/pending', getPendingMedicalBookings);
router.get('/admin/stats', getMedicalBookingStats);
router.put('/admin/booking/:bookingId/approve', approveMedicalBooking);
router.put('/admin/booking/:bookingId/reject', rejectMedicalBooking);

module.exports = router;
