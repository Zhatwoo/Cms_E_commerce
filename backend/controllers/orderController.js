// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const Project = require('../models/Project');
const InventoryMovement = require('../models/InventoryMovement');

function normalizeStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase();
}

function toCanonicalStatus(status) {
  const s = normalizeStatus(status);
  const map = {
    pending: 'Pending',
    processing: 'Processing',
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
  };
  return map[s] || '';
}

function itemQuantity(item) {
  const q = parseInt(item?.quantity, 10);
  return Number.isFinite(q) && q > 0 ? q : 1;
}

function readInventoryState(order) {
  const raw = order?.inventoryState || {};
  return {
    reservedApplied: !!(raw.reservedApplied ?? raw.reserved_applied),
    deductedApplied: !!(raw.deductedApplied ?? raw.deducted_applied),
  };
}

async function getOrderScopedSubdomain(order, userId) {
  const projectId = String(order?.projectId || '').trim();
  if (!projectId) return '';
  const project = await Project.get(userId, projectId);
  return Product.normalizeSubdomain(project?.subdomain || '');
}

async function resolveOrderProducts(order, userId) {
  const scopedSubdomain = await getOrderScopedSubdomain(order, userId);
  const lines = [];

  for (const rawItem of Array.isArray(order.items) ? order.items : []) {
    const quantity = itemQuantity(rawItem);
    const productId = String(rawItem.productId || rawItem.id || '').trim();
    const sku = String(rawItem.sku || '').trim();

    let product = null;
    if (productId) {
      product = await Product.findByIdForUser(productId, userId);
      if (product && scopedSubdomain && Product.normalizeSubdomain(product.subdomain) !== scopedSubdomain) {
        product = null;
      }
    }
    if (!product && sku) {
      product = await Product.findBySkuForUser(sku, userId, scopedSubdomain || undefined);
    }
    if (!product) {
      throw new Error(`Product not found for order item: ${productId || sku || 'unknown-item'}`);
    }
    lines.push({ product, quantity });
  }

  return lines;
}

async function writeMovement({
  userId,
  order,
  product,
  type,
  quantity,
  before,
  after,
  notes,
}) {
  await InventoryMovement.create({
    userId,
    projectId: order.projectId || product.projectId || null,
    subdomain: product.subdomain || null,
    productId: product.id,
    productName: product.name || null,
    productSku: product.sku || null,
    type,
    quantity,
    beforeOnHand: before?.onHandStock ?? null,
    afterOnHand: after?.onHandStock ?? null,
    beforeReserved: before?.reservedStock ?? null,
    afterReserved: after?.reservedStock ?? null,
    referenceType: 'order',
    referenceId: order.id,
    actor: userId,
    notes: notes || null,
  });
}

async function applyReserve(order, userId) {
  const lines = await resolveOrderProducts(order, userId);
  for (const line of lines) {
    const result = await Product.applyInventoryDeltaForUser({
      id: line.product.id,
      userId,
      reservedDelta: line.quantity,
    });
    await writeMovement({
      userId,
      order,
      product: result.product,
      type: 'RESERVE',
      quantity: line.quantity,
      before: result.before,
      after: result.after,
      notes: 'Stock reserved for order creation',
    });
  }
}

async function applyRelease(order, userId, reason = 'Reservation released') {
  const lines = await resolveOrderProducts(order, userId);
  for (const line of lines) {
    const result = await Product.applyInventoryDeltaForUser({
      id: line.product.id,
      userId,
      reservedDelta: -line.quantity,
    });
    await writeMovement({
      userId,
      order,
      product: result.product,
      type: 'RELEASE',
      quantity: -line.quantity,
      before: result.before,
      after: result.after,
      notes: reason,
    });
  }
}

async function applyDeduct(order, userId) {
  const lines = await resolveOrderProducts(order, userId);
  for (const line of lines) {
    const result = await Product.applyInventoryDeltaForUser({
      id: line.product.id,
      userId,
      onHandDelta: -line.quantity,
      reservedDelta: -line.quantity,
    });
    await writeMovement({
      userId,
      order,
      product: result.product,
      type: 'OUT',
      quantity: -line.quantity,
      before: result.before,
      after: result.after,
      notes: 'Stock deducted after payment/fulfillment',
    });
  }
}

async function applyRestock(order, userId, reason = 'Stock restocked') {
  const lines = await resolveOrderProducts(order, userId);
  for (const line of lines) {
    const result = await Product.applyInventoryDeltaForUser({
      id: line.product.id,
      userId,
      onHandDelta: line.quantity,
    });
    await writeMovement({
      userId,
      order,
      product: result.product,
      type: 'IN',
      quantity: line.quantity,
      before: result.before,
      after: result.after,
      notes: reason,
    });
  }
}

// Create order (protected - current user)
exports.create = async (req, res) => {
  try {
    const { items, total, shippingAddress, projectId } = req.body;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim() || null;
    const effectiveProjectId = String(projectId || '').trim() || headerProjectId;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }
    let data = await Order.create({
      userId: req.user.id,
      projectId: effectiveProjectId,
      items,
      total: total != null ? Number(total) : items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 1), 0),
      status: 'Pending',
      shippingAddress: shippingAddress || null,
      inventoryState: {
        reservedApplied: false,
        deductedApplied: false,
      },
    });

    try {
      await applyReserve(data, req.user.id);
      data = await Order.update(data.id, {
        inventoryState: {
          reservedApplied: true,
          deductedApplied: false,
        },
      });
    } catch (syncError) {
      await Order.delete(data.id).catch(() => {});
      return res.status(400).json({
        success: false,
        message: syncError.message || 'Unable to reserve stock for this order',
      });
    }

    res.status(201).json({ success: true, message: 'Order created', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get own orders (protected)
exports.getMyOrders = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const queryProjectId = String(req.query.projectId || '').trim() || null;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim() || null;
    const result = await Order.findByUserId(req.user.id, {
      page,
      limit,
      projectId: queryProjectId || headerProjectId,
    });
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
    const requestedStatus = toCanonicalStatus(req.body?.status);
    const allowed = ['Pending', 'Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    if (!requestedStatus || !allowed.includes(requestedStatus)) {
      return res.status(400).json({ success: false, message: 'Valid status required: ' + allowed.join(', ') });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isOwner = order.userId === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!isAdmin && !['Cancelled', 'Returned'].includes(requestedStatus)) {
      return res.status(403).json({ success: false, message: 'You can only set status to Cancelled or Returned' });
    }

    const previousStatus = toCanonicalStatus(order.status) || 'Pending';
    const inventoryState = readInventoryState(order);

    if (requestedStatus !== previousStatus) {
      const enteringDeductedState = ['Paid', 'Shipped', 'Delivered'].includes(requestedStatus);

      if (enteringDeductedState && !inventoryState.deductedApplied) {
        await applyDeduct(order, order.userId);
        inventoryState.deductedApplied = true;
        inventoryState.reservedApplied = false;
      } else if (requestedStatus === 'Cancelled') {
        if (inventoryState.reservedApplied && !inventoryState.deductedApplied) {
          await applyRelease(order, order.userId, 'Reservation released after cancellation');
          inventoryState.reservedApplied = false;
        } else if (inventoryState.deductedApplied) {
          await applyRestock(order, order.userId, 'Stock restocked after cancellation');
          inventoryState.deductedApplied = false;
          inventoryState.reservedApplied = false;
        }
      } else if (requestedStatus === 'Returned') {
        if (inventoryState.deductedApplied) {
          await applyRestock(order, order.userId, 'Stock restocked after return');
          inventoryState.deductedApplied = false;
        }
      }
    }

    const data = await Order.update(req.params.id, {
      status: requestedStatus,
      inventoryState,
    });
    res.status(200).json({ success: true, message: 'Order updated', data });
  } catch (error) {
    const statusCode = /insufficient/i.test(error.message || '') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error', error: error.message });
  }
};
