// routes/webhookRoutes.js
const express = require('express');
const router = express.Router();
const { paymongoWebhook, stripeWebhook } = require('../controllers/webhookController');

router.post('/paymongo', paymongoWebhook);
router.post('/stripe', stripeWebhook);

module.exports = router;
