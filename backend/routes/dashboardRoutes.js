// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getStats, getAnalytics } = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/auth');

router.get('/stats', protect, admin, getStats);
router.get('/analytics', protect, admin, getAnalytics);

module.exports = router;
