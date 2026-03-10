const express = require('express');
const router = express.Router();
const {
    invite,
    list,
    updatePermission,
    remove,
    sharedWithMe,
} = require('../controllers/collaborationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.use((req, res, next) => {
    console.log(`[CollabRoute] ${req.method} ${req.originalUrl}`);
    next();
});

router.get('/shared-with-me', sharedWithMe);
router.post('/:projectId/invite', invite);
router.get('/:projectId/collaborators', list);
router.patch('/:projectId/collaborators/:collabId', updatePermission);
router.delete('/:projectId/collaborators/:collabId', remove);

module.exports = router;
