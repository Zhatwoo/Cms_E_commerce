// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/auth');

router.get('/stats', protect, admin, getStats);

module.exports = router;
