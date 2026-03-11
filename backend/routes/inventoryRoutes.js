const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  getInventorySummary,
  adjustStock,
  getMovements,
  deleteMovement,
  bulkDeleteMovements,
  importInventory,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getInventoryItems);
router.get('/summary', protect, getInventorySummary);
router.get('/movements', protect, getMovements);
router.post('/movements/bulk-delete', protect, bulkDeleteMovements);
router.delete('/movements/:movementId', protect, deleteMovement);
router.post('/adjust', protect, adjustStock);
router.post('/import', protect, importInventory);

module.exports = router;
