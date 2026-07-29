const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../../auth/middleware/authMiddleware');

const controller = new DashboardController();

router.get('/', authenticateToken, (req, res) => controller.getDashboard(req, res));

module.exports = router;
