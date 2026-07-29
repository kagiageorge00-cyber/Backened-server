const logger = require('../../utils/logger');
const DashboardService = require('../services/dashboardService');

class DashboardController {
  constructor(dashboardService = new DashboardService()) {
    this.dashboardService = dashboardService;
  }

  async getDashboard(req, res) {
    try {
      const dashboard = await this.dashboardService.buildDashboard(req.user);
      return res.json({
        success: true,
        message: 'Dashboard loaded successfully.',
        data: dashboard,
      });
    } catch (error) {
      logger.error('Dashboard load failed', { error: error.message, userId: req.user?.sub });
      return res.status(500).json({ success: false, message: 'Dashboard load failed.', error: error.message });
    }
  }
}

module.exports = DashboardController;
