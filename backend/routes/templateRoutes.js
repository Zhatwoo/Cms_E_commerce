// routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, delete: deleteTemplate } = require('../controllers/templateController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', protect, admin, create);
router.put('/:id', protect, admin, update);
router.delete('/:id', protect, admin, deleteTemplate);

module.exports = router;
