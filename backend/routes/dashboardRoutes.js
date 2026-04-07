// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getStats, getAnalytics, getDashboardSummary } = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/auth');

router.get('/stats', protect, admin, getStats);
router.get('/analytics', protect, admin, getAnalytics);
router.get('/summary', protect, admin, getDashboardSummary);

module.exports = router;
