const Product = require('../models/Product');
const Project = require('../models/Project');
const InventoryMovement = require('../models/InventoryMovement');

async function resolveScopedSubdomain(userId, querySubdomain, headerProjectId) {
  const rawSubdomain = Product.normalizeSubdomain(querySubdomain || '');
  if (rawSubdomain) return rawSubdomain;

  const projectId = String(headerProjectId || '').trim();
  if (!projectId) return '';
  const selectedProject = await Project.get(userId, projectId);
  return Product.normalizeSubdomain(selectedProject?.subdomain || '');
}

function getInventoryValues(product) {
  const onHand = product.onHandStock ?? product.stock ?? null;
  const reserved = product.reservedStock ?? 0;
  const available = product.availableStock ?? (onHand != null ? Math.max(0, Number(onHand) - Number(reserved)) : null);
  const lowThreshold = product.lowStockThreshold ?? 5;
  return { onHand, reserved, available, lowThreshold };
}

exports.getInventoryItems = async (req, res) => {
  try {
    const { status, search, page, limit, subdomain } = req.query;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const scopedSubdomain = await resolveScopedSubdomain(req.user.id, subdomain, headerProjectId);

    const filters = { userId: req.user.id };
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (scopedSubdomain) filters.subdomain = scopedSubdomain;

    const result = await Product.findAllForUser(filters, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message,
    });
  }
};

exports.getInventorySummary = async (req, res) => {
  try {
    const { search, status, subdomain } = req.query;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const scopedSubdomain = await resolveScopedSubdomain(req.user.id, subdomain, headerProjectId);

    const filters = { userId: req.user.id };
    if (search) filters.search = search;
    if (status) filters.status = status;
    if (scopedSubdomain) filters.subdomain = scopedSubdomain;

    const { items } = await Product.findAllForUser(filters, { page: 1, limit: 5000 });
    const summary = items.reduce(
      (acc, item) => {
        const { onHand, reserved, lowThreshold } = getInventoryValues(item);
        const stock = Number(onHand ?? 0);
        const reservedStock = Number(reserved ?? 0);
        const unitValue = Number(item.costPrice ?? item.price ?? 0);
        const available = Math.max(0, stock - reservedStock);

        acc.totalProducts += 1;
        acc.totalOnHand += stock;
        acc.totalReserved += reservedStock;
        acc.totalAvailable += available;
        acc.stockValue += stock * unitValue;

        if (stock <= 0) acc.outOfStock += 1;
        else if (stock <= Number(lowThreshold ?? 5)) acc.lowStock += 1;
        return acc;
      },
      {
        totalProducts: 0,
        totalOnHand: 0,
        totalReserved: 0,
        totalAvailable: 0,
        lowStock: 0,
        outOfStock: 0,
        stockValue: 0,
      }
    );

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message,
    });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      movementType,
      notes,
      referenceType,
      referenceId,
      setOnHandStock,
      setReservedStock,
    } = req.body || {};

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const delta = Number(quantity || 0);
    const type = String(movementType || 'ADJUST').toUpperCase();
    const signedDelta = type === 'OUT' ? -Math.abs(delta) : type === 'IN' ? Math.abs(delta) : delta;

    const result = await Product.applyInventoryDeltaForUser({
      id: productId,
      userId: req.user.id,
      onHandDelta: setOnHandStock !== undefined ? 0 : signedDelta,
      setOnHandStock,
      setReservedStock,
    });

    if (!result?.product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await InventoryMovement.create({
      userId: req.user.id,
      projectId: result.product.projectId || null,
      subdomain: result.product.subdomain || null,
      productId: result.product.id,
      productName: result.product.name || null,
      productSku: result.product.sku || null,
      type: type || 'ADJUST',
      quantity: signedDelta,
      beforeOnHand: result.before?.onHandStock ?? null,
      afterOnHand: result.after?.onHandStock ?? null,
      beforeReserved: result.before?.reservedStock ?? null,
      afterReserved: result.after?.reservedStock ?? null,
      referenceType: referenceType || 'manual',
      referenceId: referenceId || null,
      actor: req.user?.email || req.user?.id || null,
      notes: notes || null,
    });

    res.status(200).json({ success: true, message: 'Inventory adjusted', data: result.product });
  } catch (error) {
    const statusCode = /insufficient/i.test(error.message || '') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message,
    });
  }
};

exports.getMovements = async (req, res) => {
  try {
    const { limit, productId, type, subdomain, projectId } = req.query;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const scopedSubdomain = await resolveScopedSubdomain(req.user.id, subdomain, headerProjectId);

    const movementProjectId = String(projectId || headerProjectId || '').trim() || null;
    const items = await InventoryMovement.listForUser(req.user.id, {
      limit,
      productId,
      type,
      subdomain: scopedSubdomain || undefined,
      projectId: movementProjectId || undefined,
    });

    res.status(200).json({ success: true, items });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message,
    });
  }
};
