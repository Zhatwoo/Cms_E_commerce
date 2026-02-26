// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, delete: deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAll);
router.get('/:idOrSlug', protect, getOne);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
