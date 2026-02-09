// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  getUserStats
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// Statistics route
router.get('/stats', getUserStats);

// CRUD routes
router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Special routes for role and status updates
router.put('/:id/role', updateUserRole);
router.put('/:id/status', updateUserStatus);

module.exports = router;