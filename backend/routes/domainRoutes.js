// routes/domainRoutes.js
const express = require('express');
const router = express.Router();
const { getMyDomains, getOne, create, delete: deleteDomain, getAll, updateStatus } = require('../controllers/domainController');
const { protect, admin } = require('../middleware/auth');

router.get('/my', protect, getMyDomains);
router.get('/', protect, admin, getAll);
router.get('/:id', protect, getOne);
router.post('/', protect, create);
router.delete('/:id', protect, deleteDomain);
router.put('/:id/status', protect, admin, updateStatus);

module.exports = router;
