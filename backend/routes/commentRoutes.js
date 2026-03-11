const express = require('express');
const router = express.Router();
const { add, list, resolve, remove } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Routes for comments
router.get('/:projectId/comments', list);
router.post('/:projectId/comments', add);
router.patch('/:projectId/comments/:commentId/resolve', resolve);
router.delete('/:projectId/comments/:commentId', remove);

module.exports = router;
