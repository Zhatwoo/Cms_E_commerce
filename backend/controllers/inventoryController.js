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
        else if (stock < Number(lowThreshold ?? 5)) acc.lowStock += 1;
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
      variantKey,
      setVariantStock,
    } = req.body || {};

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const delta = Number(quantity || 0);
    const type = String(movementType || 'ADJUST').toUpperCase();
    const signedDelta = type === 'OUT' ? -Math.abs(delta) : type === 'IN' ? Math.abs(delta) : delta;

    const result = await (variantKey
      ? Product.applyVariantInventoryDeltaForUser({
          id: productId,
          userId: req.user.id,
          variantKey,
          variantDelta: setVariantStock !== undefined ? 0 : signedDelta,
          setVariantStock,
        })
      : Product.applyInventoryDeltaForUser({
          id: productId,
          userId: req.user.id,
          onHandDelta: setOnHandStock !== undefined ? 0 : signedDelta,
          setOnHandStock,
          setReservedStock,
        }));

    if (!result?.product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const movementQuantity = variantKey
      ? (result?.afterVariantStock ?? 0) - (result?.beforeVariantStock ?? 0)
      : signedDelta;

    await InventoryMovement.create({
      userId: req.user.id,
      projectId: result.product.projectId || null,
      subdomain: result.product.subdomain || null,
      productId: result.product.id,
      productName: result.product.name || null,
      productSku: result.product.sku || null,
      type: type || 'ADJUST',
      quantity: movementQuantity,
      beforeOnHand: result.before?.onHandStock ?? null,
      afterOnHand: result.after?.onHandStock ?? null,
      beforeReserved: result.before?.reservedStock ?? null,
      afterReserved: result.after?.reservedStock ?? null,
      referenceType: referenceType || 'manual',
      referenceId: referenceId || null,
      actor: req.user?.email || req.user?.id || null,
      notes:
        notes ||
        (variantKey
          ? `Variant ${variantKey} stock ${movementQuantity >= 0 ? 'added' : 'deducted'}`
          : null),
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

exports.deleteMovement = async (req, res) => {
  try {
    const movementId = String(req.params.movementId || '').trim();
    if (!movementId) {
      return res.status(400).json({ success: false, message: 'movementId is required' });
    }

    const { subdomain, projectId } = req.query;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const scopedSubdomain = await resolveScopedSubdomain(req.user.id, subdomain, headerProjectId);
    const scopedProjectId = String(projectId || headerProjectId || '').trim() || undefined;

    const result = await InventoryMovement.deleteForUser(req.user.id, movementId, {
      subdomain: scopedSubdomain || undefined,
      projectId: scopedProjectId,
    });

    if (!result?.deleted) {
      return res.status(404).json({ success: false, message: 'Movement not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory movement deleted',
      data: result.item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message,
    });
  }
};

exports.bulkDeleteMovements = async (req, res) => {
  try {
    const { ids, deleteAll } = req.body || {};
    const { subdomain, projectId } = req.query;
    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const scopedSubdomain = await resolveScopedSubdomain(req.user.id, subdomain, headerProjectId);
    const scopedProjectId = String(projectId || headerProjectId || '').trim() || undefined;

    if (deleteAll) {
      const result = await InventoryMovement.deleteAllForUser(req.user.id, {
        subdomain: scopedSubdomain || undefined,
        projectId: scopedProjectId,
      });

      return res.status(200).json({
        success: true,
        message: result.deleted > 0 ? `Deleted ${result.deleted} movement(s)` : 'No movements to delete',
        data: result,
      });
    }

    const movementIds = Array.isArray(ids) ? ids : [];
    const normalizedIds = movementIds.map((id) => String(id || '').trim()).filter(Boolean);
    if (normalizedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids array is required to delete selected movements',
      });
    }

    const result = await InventoryMovement.deleteManyForUser(req.user.id, normalizedIds, {
      subdomain: scopedSubdomain || undefined,
      projectId: scopedProjectId,
    });

    return res.status(200).json({
      success: true,
      message: result.deleted > 0 ? `Deleted ${result.deleted} movement(s)` : 'No movements deleted',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message,
    });
  }
};

function toIntOrNull(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

exports.importInventory = async (req, res) => {
  try {
    const { rows } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'rows array is required and must not be empty',
        updated: 0,
        errors: [],
      });
    }

    const headerProjectId = String(req.headers['x-project-id'] || '').trim();
    const scopedSubdomain = await resolveScopedSubdomain(req.user.id, null, headerProjectId);

    const errors = [];
    let updated = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sku = row?.sku != null ? String(row.sku).trim() : '';
      if (!sku) {
        errors.push({ row: i + 1, sku: String(row?.sku ?? ''), message: 'SKU is required' });
        continue;
      }

      const product = await Product.findBySkuForUser(sku, req.user.id, scopedSubdomain || undefined);
      if (!product) {
        errors.push({ row: i + 1, sku, message: 'Product not found' });
        continue;
      }

      const updateData = {};
      if (row.onHandStock !== undefined && row.onHandStock !== null && row.onHandStock !== '') {
        const v = toIntOrNull(row.onHandStock);
        if (v !== undefined) updateData.onHandStock = Math.max(0, v);
      }
      if (row.reservedStock !== undefined && row.reservedStock !== null && row.reservedStock !== '') {
        const v = toIntOrNull(row.reservedStock);
        if (v !== undefined) updateData.reservedStock = Math.max(0, v);
      }
      if (row.lowStockThreshold !== undefined && row.lowStockThreshold !== null && row.lowStockThreshold !== '') {
        const v = toIntOrNull(row.lowStockThreshold);
        if (v !== undefined) updateData.lowStockThreshold = Math.max(0, v);
      }

      if (Object.keys(updateData).length === 0) {
        continue;
      }

      const beforeOnHand = product.onHandStock ?? product.stock ?? 0;

      const updatedProduct = await Product.updateForUser(product.id, req.user.id, updateData);
      if (!updatedProduct) {
        errors.push({ row: i + 1, sku, message: 'Update failed' });
        continue;
      }

      updated += 1;

      const afterOnHand = updatedProduct.onHandStock ?? updatedProduct.stock ?? 0;
      const quantity = afterOnHand - beforeOnHand;
      if (quantity !== 0) {
        await InventoryMovement.create({
          userId: req.user.id,
          projectId: updatedProduct.projectId || null,
          subdomain: updatedProduct.subdomain || null,
          productId: updatedProduct.id,
          productName: updatedProduct.name || null,
          productSku: updatedProduct.sku || null,
          type: 'ADJUST',
          quantity,
          beforeOnHand,
          afterOnHand,
          beforeReserved: product.reservedStock ?? null,
          afterReserved: updatedProduct.reservedStock ?? null,
          referenceType: 'csv_import',
          referenceId: null,
          actor: req.user?.email || req.user?.id || null,
          notes: 'Bulk import from CSV',
        });
      }
    }

    res.status(200).json({
      success: true,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      message: updated > 0 ? `Updated ${updated} product(s)` : errors.length === rows.length ? 'No products updated' : `Updated ${updated}, ${errors.length} row(s) had errors`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message,
      updated: 0,
      errors: [],
    });
  }
};
