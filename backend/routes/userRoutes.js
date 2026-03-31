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
  updateSubscriptionPlan,
  getUserStats,
  getAdmins
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);

// Get all admins for chat - accessible by protected users (clients and admins)
router.get('/admins/list', getAdmins);

// Admin-only routes from this point down
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

// Special routes for role, status, and plan updates
router.put('/:id/role', updateUserRole);
router.put('/:id/status', updateUserStatus);
router.put('/:id/plan', updateSubscriptionPlan);

module.exports = router;