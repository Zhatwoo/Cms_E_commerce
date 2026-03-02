// Public (no auth): get published site content by subdomain for live site viewer
const Domain = require('../models/Domain');
const Product = require('../models/Product');

exports.getBySubdomain = async (req, res) => {
  try {
    const subdomain = (req.params.subdomain || '').toString().trim();
    if (!subdomain) {
      return res.status(400).json({ success: false, message: 'Subdomain is required' });
    }
    const domain = await Domain.findBySubdomain(subdomain);
    if (!domain || !domain.userId || !domain.projectId) {
      return res.status(404).json({ success: false, message: 'Site not found. Publish from Preview or sync domains in Dashboard.' });
    }
    // Serve only the published snapshot so edits that are not yet published are not visible
    const content = domain.publishedContent ?? null;
    if (content == null) {
      return res.status(200).json({ success: true, data: { content: null }, subdomain: domain.subdomain, projectTitle: domain.projectTitle });
    }
    res.status(200).json({
      success: true,
      data: { content },
      subdomain: domain.subdomain,
      projectTitle: domain.projectTitle,
    });
  } catch (error) {
    console.error('getBySubdomain error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Public: list products for storefront (published/active only)
exports.getProducts = async (req, res) => {
  try {
    const subdomain = (req.params.subdomain || '').toString().trim();
    if (!subdomain) {
      return res.status(400).json({ success: false, message: 'Subdomain is required' });
    }
    const domain = await Domain.findBySubdomain(subdomain);
    if (!domain || !domain.userId || !domain.projectId) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }
    const published = await Product.findPublicBySubdomain(subdomain, { limit: 100 });
    res.status(200).json({ success: true, data: published });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
