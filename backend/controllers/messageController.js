// controllers/messageController.js
const Message = require('../models/Message');
const User = require('../models/User');

exports.getMessages = async (req, res) => {
  try {
    const { type, status, limit } = req.query;
    const messages = await Message.find({ type, status, limit: parseInt(limit) || 50 });
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all conversations for the current user
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[getConversations] Fetching conversations for userId: ${userId}`);
    const conversations = await Message.getConversations(userId, 100);

    // Backfill missing user identity data for older messages that may not have sender/recipient names.
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const profile = await User.findById(conversation.otherUserId).catch(() => null);
        const resolvedName =
          conversation.otherUserName ||
          profile?.displayName ||
          profile?.fullName ||
          profile?.username ||
          profile?.email ||
          'Unknown';

        return {
          ...conversation,
          otherUserName: resolvedName,
          otherUserAvatar: conversation.otherUserAvatar || profile?.avatar || null,
          otherUserUsername: profile?.username || '',
          otherUserEmail: profile?.email || ''
        };
      })
    );

    console.log(`[getConversations] Found ${enrichedConversations.length} conversations`);
    res.status(200).json({ success: true, data: enrichedConversations });
  } catch (error) {
    console.error(`[getConversations] Error:`, error.message, error.code);
    res.status(500).json({ success: false, message: error.message, code: error.code });
  }
};

/**
 * Get messages in a specific conversation
 */
exports.getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;
    const { limit } = req.query;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'otherUserId is required' });
    }

    console.log(`[getConversationMessages] Fetching messages for ${userId} ↔ ${otherUserId}`);
    const messages = await Message.getConversationMessages(userId, otherUserId, parseInt(limit) || 50);

    const senderIds = Array.from(new Set(messages.map((m) => m.senderId).filter(Boolean)));
    const senderProfiles = new Map();

    await Promise.all(
      senderIds.map(async (id) => {
        const profile = await User.findById(id).catch(() => null);
        senderProfiles.set(id, profile);
      })
    );

    const enrichedMessages = messages.map((msg) => {
      const profile = senderProfiles.get(msg.senderId);
      return {
        ...msg,
        senderName:
          msg.senderName ||
          profile?.displayName ||
          profile?.fullName ||
          profile?.username ||
          profile?.email ||
          'Unknown',
        senderAvatar: msg.senderAvatar || profile?.avatar || null
      };
    });

    console.log(`[getConversationMessages] Found ${enrichedMessages.length} messages`);
    
    // Mark as read
    await Message.markConversationAsRead(userId, otherUserId);
    
    res.status(200).json({ success: true, data: enrichedMessages });
  } catch (error) {
    console.error(`[getConversationMessages] Error: ${error.message} (${error.code})`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { message, type, websiteId, senderName, senderAvatar, recipientId } = req.body;
    
    // For internal/request: senderId is the current admin
    // For support (simulated from website): could be different logic
    const senderId = type === 'support' ? 'client-form' : req.user.id;
    const senderProfile = senderId !== 'client-form' ? await User.findById(senderId).catch(() => null) : null;
    const finalSenderName =
      senderName ||
      req.user.displayName ||
      req.user.fullName ||
      req.user.name ||
      req.user.username ||
      req.user.email ||
      senderProfile?.displayName ||
      senderProfile?.fullName ||
      senderProfile?.username ||
      senderProfile?.email ||
      'Administrator';
    const finalSenderAvatar = senderAvatar || req.user.avatar || senderProfile?.avatar || null;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // For direct messages, require recipientId
    if (type === 'direct' && !recipientId) {
      return res.status(400).json({ success: false, message: 'recipientId is required for direct messages' });
    }

    // For direct messages, fetch recipient details
    let recipientName = null;
    let recipientAvatar = null;
    if (type === 'direct' && recipientId) {
      try {
        const recipient = await User.findById(recipientId);
        if (recipient) {
          recipientName = recipient.displayName || recipient.username || recipient.email || 'Unknown';
          recipientAvatar = recipient.avatar || null;
        }
      } catch (err) {
        console.error('Failed to fetch recipient details:', err);
      }
    }

    const newMessage = await Message.create({
      senderId,
      senderName: finalSenderName,
      senderAvatar: finalSenderAvatar,
      recipientId: recipientId || null,
      recipientName,
      recipientAvatar,
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
