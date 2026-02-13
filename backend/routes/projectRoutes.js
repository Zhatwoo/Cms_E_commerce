const express = require('express');
const router = express.Router();
const { list, create, getOne, getBySubdomain, update, delete: deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', list);
router.get('/by-subdomain', getBySubdomain);
router.post('/', create);
router.get('/:id', getOne);
router.patch('/:id', update);
router.delete('/:id', deleteProject);

module.exports = router;
