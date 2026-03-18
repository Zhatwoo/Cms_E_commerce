const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const router = express.Router();
const { list, create, getOne, getBySubdomain, update, delete: deleteProject, listTrash, restore, permanentDelete, uploadMedia, deleteMedia, getStorageUsage } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(os.tmpdir(), 'mercato-media');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '') || '';
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const m = (file.mimetype || '').toLowerCase();
    if (m.startsWith('image/') || m.startsWith('video/') || m === 'application/pdf') return cb(null, true);
    cb(new Error('Allowed: images, videos, PDF'));
  },
});

router.use(protect);

router.get('/', list);
router.get('/trash', listTrash);
router.get('/by-subdomain', getBySubdomain);
router.post('/', create);
router.post('/:id/restore', restore);
router.post('/:id/media', (req, res, next) => {
  mediaUpload.single('media')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large (max 1GB).' });
      return res.status(400).json({ success: false, message: err.message || 'Invalid file' });
    }
    next();
  });
}, uploadMedia);
router.delete('/:id/media', deleteMedia);
router.get('/:id', getOne);
router.get('/:id/storage', getStorageUsage);
router.patch('/:id', update);
router.delete('/:id', deleteProject);
router.delete('/:id/permanent', permanentDelete);

module.exports = router;
