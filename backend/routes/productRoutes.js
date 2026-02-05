// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, delete: deleteProduct } = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:idOrSlug', getOne);
router.post('/', protect, admin, create);
router.put('/:id', protect, admin, update);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
