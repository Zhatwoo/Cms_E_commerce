// routes/pageRoutes.js
const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, delete: deletePage, autoSave, getDraft, deleteDraft } = require('../controllers/pageController');
const { protect } = require('../middleware/auth');


router.get('/', getAll);
router.post('/autosave', protect, autoSave);
router.get('/draft', protect, getDraft);
router.delete('/draft', protect, deleteDraft);
router.get('/:idOrSlug', getOne);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, deletePage);

module.exports = router;

