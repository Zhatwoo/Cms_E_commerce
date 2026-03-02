const express = require('express');
const router = express.Router();
const { list, create, getOne, getBySubdomain, update, delete: deleteProject, listTrash, restore, permanentDelete } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', list);
router.get('/trash', listTrash);
router.get('/by-subdomain', getBySubdomain);
router.post('/', create);
router.get('/:id', getOne);
router.patch('/:id', update);
router.post('/:id/restore', restore);
router.delete('/:id', deleteProject);
router.delete('/:id/permanent', permanentDelete);

module.exports = router;
