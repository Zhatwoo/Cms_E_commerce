// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, markRead } = require('../controllers/messageController');
const { protect, admin } = require('../middleware/auth');

// All messaging endpoints are protected - only logged-in users (admins/super_admins) can use them in this dashboard.
router.use(protect);

router.get('/', getMessages);
router.post('/', sendMessage);
router.patch('/:id/read', markRead);

module.exports = router;
