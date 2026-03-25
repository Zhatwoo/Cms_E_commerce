const express = require('express');
const router = express.Router();
const {
    add, list, resolve, move, update, remove,
    addReply, deleteReply,
    addReaction, removeReaction,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Comments
router.get('/:projectId/comments', list);
router.post('/:projectId/comments', add);
router.patch('/:projectId/comments/:commentId/resolve', resolve);
router.patch('/:projectId/comments/:commentId/position', move);
router.patch('/:projectId/comments/:commentId', update);
router.delete('/:projectId/comments/:commentId', remove);

// Replies
router.post('/:projectId/comments/:commentId/replies', addReply);
router.delete('/:projectId/comments/:commentId/replies/:replyId', deleteReply);

// Reactions
router.post('/:projectId/comments/:commentId/reactions', addReaction);
router.delete('/:projectId/comments/:commentId/reactions', removeReaction);

module.exports = router;
