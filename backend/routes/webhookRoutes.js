// routes/webhookRoutes.js
const express = require('express');
const router = express.Router();
const { paymongoWebhook } = require('../controllers/webhookController');

router.post('/paymongo', paymongoWebhook);

module.exports = router;
