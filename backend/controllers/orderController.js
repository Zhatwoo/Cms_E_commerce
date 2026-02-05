// controllers/orderController.js
const Order = require('../models/Order');

// Create order (protected - current user)
exports.create = async (req, res) => {
  try {
    const { items, total, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }
    const data = await Order.create({
      userId: req.user.id,
      items,
      total: total != null ? Number(total) : items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 1), 0),
      status: 'Pending',
      shippingAddress: shippingAddress || null
    });
    res.status(201).json({ success: true, message: 'Order created', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get own orders (protected)
exports.getMyOrders = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await Order.findByUserId(req.user.id, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get one order by id (owner or admin)
exports.getOne = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (req.user.role !== 'Admin' && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: list all orders
exports.getAll = async (req, res) => {
  try {
    const { status, userId, page, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (userId) filters.userId = userId;
    const result = await Order.findAll(filters, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin: update order status
exports.updateStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const { status } = req.body;
    const allowed = ['Pending', 'Paid', 'Shipped', 'Cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status required: ' + allowed.join(', ') });
    }
    const data = await Order.update(req.params.id, { status });
    res.status(200).json({ success: true, message: 'Order updated', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
