// routes/domainRoutes.js
const express = require('express');
const router = express.Router();
const { getMyDomains, getOne, create, delete: deleteDomain, getAll, updateStatus, syncPublicLookup, publish, unpublish, updateSubdomain, schedulePublish, getSchedule, getPublishHistory, getManagementList, setClientDomainStatus } = require('../controllers/domainController');
const { listCustomDomains, addCustomDomain, verifyCustomDomain, removeCustomDomain } = require('../controllers/customDomainController');
const { protect, admin } = require('../middleware/auth');

router.get('/my', protect, getMyDomains);
router.get('/admin/management', protect, admin, getManagementList);
router.post('/admin/set-client-status', protect, admin, setClientDomainStatus);
router.post('/publish', protect, publish);
router.post('/unpublish', protect, unpublish);
router.post('/update-subdomain', protect, updateSubdomain);
router.post('/schedule-publish', protect, schedulePublish);
router.get('/schedule', protect, getSchedule);
router.get('/publish-history', protect, getPublishHistory);
router.post('/sync-public', protect, syncPublicLookup);

// Custom domain management
router.get('/custom', protect, listCustomDomains);
router.post('/custom', protect, addCustomDomain);
router.post('/custom/verify', protect, verifyCustomDomain);
router.delete('/custom', protect, removeCustomDomain);

router.get('/', protect, admin, getAll);
router.get('/:id', protect, getOne);
router.post('/', protect, create);
router.delete('/:id', protect, deleteDomain);
router.put('/:id/status', protect, admin, updateStatus);

module.exports = router;
