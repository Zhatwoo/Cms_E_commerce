const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// All notification routes are administrative.
// We keep it flat.
router.get('/', notificationController.getNotifications);
router.post('/', notificationController.addNotification);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
