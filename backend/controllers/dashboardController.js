// controllers/dashboardController.js
const User = require('../models/User');
const Page = require('../models/Page');
const Post = require('../models/Post');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get dashboard stats (users, pages, posts, products, orders)
// @route   GET /api/dashboard/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const [userStats, pagesCount, postsCount, productsCount, ordersCount] = await Promise.all([
      User.getStats(),
      Page.count(),
      Post.count(),
      Product.count(),
      Order.count()
    ]);
    res.status(200).json({
      success: true,
      stats: {
        users: userStats,
        pages: pagesCount,
        posts: postsCount,
        products: productsCount,
        orders: ordersCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
