const express = require('express');
const router = express.Router();
const { 
    getMachines, 
    getMachineStats, 
    updateMachineStatus,
    getLossAnalytics,
    getTopLossReasons,
    resetMachinesForNewDay,
    setMachineProduct 
} = require('../controllers/machineController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, getMachines);
router.get('/stats', authMiddleware, getMachineStats);
router.put('/:id/status', authMiddleware, updateMachineStatus);
router.get('/loss-analytics', authMiddleware, roleMiddleware('owner', 'manager'), getLossAnalytics);
router.get('/top-loss-reasons', authMiddleware, roleMiddleware('owner', 'manager'), getTopLossReasons);
router.post('/reset', authMiddleware, roleMiddleware('owner'), resetMachinesForNewDay);
router.put('/:id/product', authMiddleware, setMachineProduct);

module.exports = router;