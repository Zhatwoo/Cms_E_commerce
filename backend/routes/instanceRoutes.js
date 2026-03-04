const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { list, create, update, delete: deleteInstance } = require('../controllers/instanceController');

router.use(protect);

router.get('/', list);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', deleteInstance);

module.exports = router;
