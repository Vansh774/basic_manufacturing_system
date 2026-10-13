const express = require('express');
const router = express.Router();
const {
    addProductionEntry,
    getTodayProduction,
    getProductionByDate,
    getShiftProductivity
} = require('../controllers/productionController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, addProductionEntry);
router.get('/today', authMiddleware, getTodayProduction);
router.get('/date/:date', authMiddleware, getProductionByDate);
router.get('/shift/:date', authMiddleware, getShiftProductivity);

module.exports = router;