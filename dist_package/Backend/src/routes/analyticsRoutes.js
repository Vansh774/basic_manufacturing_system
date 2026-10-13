const express = require('express');
const router = express.Router();
const { getDowntimeAnalytics, getMostStoppedMachines } = require('../controllers/analyticsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// GET /api/analytics/downtime?range=today|1month|6months|1year
router.get('/downtime', authMiddleware, roleMiddleware('owner', 'manager'), getDowntimeAnalytics);

// GET /api/analytics/most-stopped?range=today|1month|6months|all&sortBy=count|duration
router.get('/most-stopped', authMiddleware, roleMiddleware('owner', 'manager'), getMostStoppedMachines);

module.exports = router;
