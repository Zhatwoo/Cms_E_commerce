// controllers/dashboardController.js
const User = require('../models/User');
const Page = require('../models/Page');
const Post = require('../models/Post');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Domain = require('../models/Domain');
const Project = require('../models/Project');

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

// @desc    Get analytics for Monitoring & Analytics (real data)
// @route   GET /api/dashboard/analytics?period=7days|30days|3months
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
  try {
    const period = req.query.period || '7days';
    const [userStats, publishedList, totalRevenue, revenueOverTime, signupsOverTime, totalProjects] = await Promise.all([
      User.getStats(),
      Domain.listAllFromPublishedSubdomains(),
      Order.getTotalRevenue(),
      Order.getRevenueByPeriod(period),
      User.getSignupsOverTime(period),
      Project.countAll()
    ]);
    const publishedWebsites = publishedList.length;
    const activeUsers = (userStats.byStatus?.active || 0) + (userStats.byStatus?.published || 0);
    const clientCount = userStats.byRole?.client || 0;
    const draftSites = Math.max(0, totalProjects - publishedWebsites);
    const avgSitesPerUser = clientCount > 0 ? (publishedWebsites / clientCount).toFixed(1) : '0';
    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          activeUsers,
          revenue: Math.round(totalRevenue * 100) / 100,
          publishedWebsites
        },
        subscriptionDistribution: userStats.byPlan || { free: 0, basic: 0, pro: 0 },
        signupsOverTime: signupsOverTime || { labels: [], signups: [] },
        revenueOverTime: revenueOverTime || { labels: [], data: [] },
        workspace: {
          totalProjects,
          draftSites,
          customDomains: publishedWebsites,
          avgSitesPerUser
        }
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
