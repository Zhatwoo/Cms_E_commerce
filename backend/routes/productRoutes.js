// routes/productRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { getAll, getOne, create, update, delete: deleteProduct, uploadImage } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only images are allowed'));
  }
});

router.get('/', protect, getAll);
router.post('/upload-image', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large (max 8MB).' });
      return res.status(400).json({ success: false, message: err.message || 'Invalid file' });
    }
    next();
  });
}, uploadImage);
router.get('/:idOrSlug', protect, getOne);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
