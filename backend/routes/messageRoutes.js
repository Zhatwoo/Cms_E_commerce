// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getMessages, 
  sendMessage, 
  markRead,
  getConversations,
  getConversationMessages
} = require('../controllers/messageController');
const { protect, admin } = require('../middleware/auth');

// All messaging endpoints are protected - only logged-in users (admins/super_admins) can use them in this dashboard.
router.use(protect);

// Legacy message endpoints
router.get('/', getMessages);
router.post('/', sendMessage);
router.patch('/:id/read', markRead);

// Conversation endpoints (for direct admin-to-admin chat)
router.get('/conversations/list', getConversations);
router.get('/conversations/:otherUserId', getConversationMessages);

module.exports = router;
