const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  getInventorySummary,
  adjustStock,
  getMovements,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getInventoryItems);
router.get('/summary', protect, getInventorySummary);
router.get('/movements', protect, getMovements);
router.post('/adjust', protect, adjustStock);

module.exports = router;
