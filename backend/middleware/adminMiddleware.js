// middleware/adminMiddleware.js
// Requires `protect` to have run first to populate req.user.
module.exports = function admin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
};
