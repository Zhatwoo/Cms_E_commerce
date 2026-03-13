// routes/webhookRoutes.js
const express = require('express');
const router = express.Router();
const { paymongoWebhook, xenditWebhook } = require('../controllers/webhookController');

router.post('/paymongo', paymongoWebhook);
router.post('/xendit', xenditWebhook);

module.exports = router;
