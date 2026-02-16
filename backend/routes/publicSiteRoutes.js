const express = require('express');
const router = express.Router();
const { getBySubdomain, getProducts } = require('../controllers/publicSiteController');

router.get('/sites/:subdomain', getBySubdomain);
router.get('/sites/:subdomain/products', getProducts);

module.exports = router;
