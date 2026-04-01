const Notification = require('../models/Notification');

const IMPORTANT_NOTIFICATION_TITLES = new Set([
  'website published',
  'website updated',
  'website deleted',
  'website permanently deleted',
  'website offline',
  'website taken down',
  'website flagged',
  'product created',
  'product updated',
  'product deleted',
  'product removed',
]);

function isImportantNotification(title) {
  const normalizedTitle = String(title || '').trim().toLowerCase();
  return IMPORTANT_NOTIFICATION_TITLES.has(normalizedTitle);
}

/** Admin: list latest shared notifications. */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll();
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Admin: add a new shared notification (audit event). Broadcasts to all admins via Socket.IO. */
exports.addNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!isImportantNotification(title)) {
      return res.status(202).json({
        success: true,
        ignored: true,
        message: 'Notification ignored. Only important website/product notifications are allowed.',
      });
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info', 
      adminId: req.user?.id || 'admin',
      adminName: req.user?.name || req.user?.email || 'Administrator'
    });

    const io = req.app.get('io');
    if (io) {
        console.log('[Notification] Broadcasting new event to all admins');
        io.emit('notification:added', notification);
    }

    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Admin: mark a notification as read (globally for this notification). */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.markRead(id);

    const io = req.app.get('io');
    if (io) {
        io.emit('notification:updated', { id, read: true });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Admin: mark all notifications as read. */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead();

    const io = req.app.get('io');
    if (io) {
      io.emit('notification:all_read');
    }

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Admin: delete a notification globally. */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.delete(id);

    const io = req.app.get('io');
    if (io) {
        io.emit('notification:deleted', { id });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
