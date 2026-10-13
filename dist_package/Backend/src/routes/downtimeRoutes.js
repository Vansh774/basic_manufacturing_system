const express = require('express');
const router = express.Router();
const {
    reportDowntime,
    resolveDowntime,
    getOpenDowntime,
    getDowntimeAnalytics,
    getMachineDowntimeStats
} = require('../controllers/downtimeController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Existing routes
router.post('/', authMiddleware, reportDowntime);
router.put('/:id/resolve', authMiddleware, resolveDowntime);
router.get('/open', authMiddleware, getOpenDowntime);

// New analytics routes (only for owner)
router.get('/analytics', authMiddleware, roleMiddleware('owner'), getDowntimeAnalytics);
router.get('/stats', authMiddleware, roleMiddleware('owner'), getMachineDowntimeStats);

module.exports = router;