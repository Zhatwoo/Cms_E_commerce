// controllers/messageController.js
const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const { type, status, limit } = req.query;
    const messages = await Message.find({ type, status, limit: parseInt(limit) || 50 });
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { message, type, websiteId, senderName, senderAvatar } = req.body;
    
    // For internal/request: senderId is the current admin
    // For support (simulated from website): could be different logic
    const senderId = type === 'support' ? 'client-form' : req.user.id;
    const finalSenderName = senderName || req.user.name || 'Administrator';
    const finalSenderAvatar = senderAvatar || req.user.avatar || null;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const newMessage = await Message.create({
      senderId,
      senderName: finalSenderName,
      senderAvatar: finalSenderAvatar,
      message,
      type: type || 'internal',
      websiteId: websiteId || null
    });

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const message = await Message.markAsRead(req.params.id);
    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
