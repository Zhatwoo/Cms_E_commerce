const express = require('express');
const router = express.Router();
const { getBySubdomain } = require('../controllers/publicSiteController');

router.get('/sites/:subdomain', getBySubdomain);

module.exports = router;
