// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const Project = require('../models/Project');
const InventoryMovement = require('../models/InventoryMovement');
const Domain = require('../models/Domain');
const StorefrontOrder = require('../models/StorefrontOrder');
const paypalService = require('../services/paypalService');

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

function numberOrFallback(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeText(value) {
  return String(value || '').trim();
}

function normalizeCheckoutItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((raw) => {
      const quantity = itemQuantity(raw);
      const price = numberOrFallback(raw?.price, 0);
      const productId = safeText(raw?.productId || raw?.id);
      const sku = safeText(raw?.sku);
      const name = safeText(raw?.name);
      const image = safeText(raw?.image);
      const subtotal = Number((price * quantity).toFixed(2));
      return {
        id: productId || undefined,
        productId: productId || undefined,
        sku: sku || undefined,
        name: name || undefined,
        image: image || undefined,
        quantity,
        price,
        subtotal,
      };
    })
    .filter((item) => item.quantity > 0 && Number.isFinite(item.price) && item.price >= 0);
}

function normalizeShippingAddress(shippingAddress) {
  const raw = shippingAddress && typeof shippingAddress === 'object' ? shippingAddress : {};
  const fullName = safeText(raw.fullName || raw.name);
  const email = safeText(raw.email || raw.emailAddress);
  const phone = safeText(raw.phone || raw.contactNumber);
  const street = safeText(raw.street || raw.streetAddress || raw.addressLine1);
  const city = safeText(raw.city);
  const state = safeText(raw.state || raw.province);
  const postalCode = safeText(raw.postalCode || raw.zip);
  const country = safeText(raw.country);

  return {
    fullName: fullName || undefined,
    name: fullName || undefined,
    email: email || undefined,
    phone: phone || undefined,
    contactNumber: phone || undefined,
    addressLine1: street || undefined,
    street: street || undefined,
    city: city || undefined,
    state: state || undefined,
    province: state || undefined,
    zip: postalCode || undefined,
    postalCode: postalCode || undefined,
    country: country || undefined,
  };
}

function missingShippingFields(address) {
  const required = ['fullName', 'email', 'phone', 'street', 'city', 'state', 'postalCode', 'country'];
  return required.filter((key) => !safeText(address?.[key]));
}

async function getOwnedSubdomains(userId) {
  const domains = await Domain.listByClient(userId);
  const owned = new Set(
    domains
      .map((domain) => StorefrontOrder.normalizeSubdomain(domain?.subdomain))
      .filter(Boolean)
  );
  return owned;
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

// Public storefront checkout: insert into published_subdomains/{subdomain}/orders
exports.createPublicCheckout = async (req, res) => {
  try {
    const normalizedSubdomain = StorefrontOrder.normalizeSubdomain(req.params.subdomain || req.siteIdentifier || '');
    if (!normalizedSubdomain) {
      return res.status(400).json({ success: false, message: 'Subdomain is required' });
    }

    // Use direct published_subdomains lookup to avoid collectionGroup index requirements.
    const domain = await Domain.findByPublishedSubdomain(normalizedSubdomain);
    if (!domain || !domain.userId || !domain.projectId) {
      return res.status(404).json({ success: false, message: 'Published site not found' });
    }

    const items = normalizeCheckoutItems(req.body?.items);
    if (!items.length) {
      return res.status(400).json({ success: false, message: 'At least one valid item is required' });
    }

    const shippingAddress = normalizeShippingAddress(req.body?.shippingAddress || {});
    const missing = missingShippingFields(shippingAddress);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing shipping fields: ${missing.join(', ')}`,
      });
    }

    const computedTotal = Number(items.reduce((sum, item) => sum + numberOrFallback(item.price, 0) * item.quantity, 0).toFixed(2));
    const requestedTotal = numberOrFallback(req.body?.total, computedTotal);
    const total = requestedTotal > 0 ? requestedTotal : computedTotal;
    const currency = safeText(req.body?.currency || 'PHP') || 'PHP';

    const data = await StorefrontOrder.createForSubdomain({
      subdomain: normalizedSubdomain,
      ownerUserId: domain.userId,
      projectId: domain.projectId || null,
      domainId: domain.id || null,
      items,
      total,
      status: 'Pending',
      shippingAddress,
      currency,
    });

    res.status(201).json({ success: true, message: 'Checkout saved', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Public: get PayMongo public key (deprecated; kept for backwards compat)
exports.getPaymongoPublicKey = (_req, res) => {
  return res.status(503).json({ success: false, message: 'Payment not configured (using PayPal)' });
};

// Public: create PayPal order for a published order (redirect to PayPal)
exports.createPaymentIntent = async (req, res) => {
  try {
    const subdomain = StorefrontOrder.normalizeSubdomain(req.params.subdomain || '');
    const orderId = safeText(req.params.id);

    if (!subdomain || !orderId) {
      return res.status(400).json({ success: false, message: 'subdomain and order id are required' });
    }

    const order = await StorefrontOrder.findById(subdomain, orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Order is not pending payment' });
    }

    const baseUrl = (process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const successUrl = `${baseUrl}/sites/${subdomain}/checkout/result?order_id=${orderId}&status=success`;
    const cancelUrl = `${baseUrl}/sites/${subdomain}/checkout/result?order_id=${orderId}&status=failed`;

    const amount = Number(order.total || 0);
    const currency = order.currency || 'PHP';

    const { approveUrl, orderId: paypalOrderId } = await paypalService.createOrder({
      amount: Math.max(0.01, amount),
      currency,
      returnUrl: successUrl,
      cancelUrl,
      customId: `${subdomain}:${orderId}`,
    });

    await StorefrontOrder.updatePaymentFields(subdomain, orderId, { paypalOrderId });
    return res.status(200).json({ success: true, redirectUrl: approveUrl });
  } catch (error) {
    const statusCode = /required|invalid|not found/i.test(error.message || '') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
};

// Public: capture PayPal order after user returns (called from result page)
exports.capturePayPal = async (req, res) => {
  try {
    const subdomain = StorefrontOrder.normalizeSubdomain(req.params.subdomain || '');
    const orderId = safeText(req.params.id);
    const token = safeText(req.query.token || req.body?.token);

    if (!subdomain || !orderId || !token) {
      return res.status(400).json({ success: false, message: 'subdomain, order id, and token are required' });
    }

    const order = await StorefrontOrder.findById(subdomain, orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status === 'Paid') {
      return res.status(200).json({ success: true, message: 'Already paid' });
    }
    if (order.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Order is not pending payment' });
    }

    const storedPaypalId = order.paypal_order_id || order.paypalOrderId;
    if (!storedPaypalId || storedPaypalId !== token) {
      return res.status(400).json({ success: false, message: 'Invalid payment session' });
    }

    await paypalService.captureOrder(token);
    await StorefrontOrder.updateStatusBySubdomainAndId(subdomain, orderId, 'Paid');
    return res.status(200).json({ success: true });
  } catch (error) {
    const statusCode = /required|invalid|not found/i.test(error.message || '') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
};

// Owner: list checkouts from published_subdomains/{subdomain}/orders for owned domains
exports.getMyPublishedOrders = async (req, res) => {
  try {
    const requestedSubdomain = StorefrontOrder.normalizeSubdomain(req.query.subdomain || '');
    const ownedSubdomains = await getOwnedSubdomains(req.user.id);
    let subdomains = Array.from(ownedSubdomains);

    if (requestedSubdomain) {
      subdomains = ownedSubdomains.has(requestedSubdomain) ? [requestedSubdomain] : [];
    }

    const result = await StorefrontOrder.listByOwner({
      ownerUserId: req.user.id,
      subdomains,
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Owner: update checkout status for a specific published subdomain order
exports.updatePublishedOrderStatus = async (req, res) => {
  try {
    const subdomain = StorefrontOrder.normalizeSubdomain(req.params.subdomain || '');
    const orderId = safeText(req.params.id);
    if (!subdomain || !orderId) {
      return res.status(400).json({ success: false, message: 'subdomain and order id are required' });
    }

    const ownedSubdomains = await getOwnedSubdomains(req.user.id);
    if (!ownedSubdomains.has(subdomain)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const requestedStatus = toCanonicalStatus(req.body?.status);
    const allowed = ['Pending', 'Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    if (!requestedStatus || !allowed.includes(requestedStatus)) {
      return res.status(400).json({ success: false, message: 'Valid status required: ' + allowed.join(', ') });
    }

    const data = await StorefrontOrder.updateStatusForOwner({
      ownerUserId: req.user.id,
      subdomain,
      orderId,
      status: requestedStatus,
    });
    if (!data) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order updated', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
