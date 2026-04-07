const express = require('express');
const router = express.Router();
const { trackPageView } = require('../controllers/analyticsController');

// Public endpoint - no auth required
router.post('/track-view', trackPageView);

module.exports = router;
