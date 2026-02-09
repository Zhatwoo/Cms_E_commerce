// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { create, getMyOrders, getOne, getAll, updateStatus } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, create);
router.get('/my', protect, getMyOrders);
router.get('/', protect, admin, getAll);
router.get('/:id', protect, getOne);
router.put('/:id/status', protect, admin, updateStatus);

module.exports = router;
