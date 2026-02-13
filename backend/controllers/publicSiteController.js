// Public (no auth): get published site content by subdomain for live site viewer
const Domain = require('../models/Domain');
const Page = require('../models/Page');

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
    let draft = null;
    try {
      draft = await Page.getPageData(domain.userId, domain.projectId, domain.userId);
    } catch (e) {
      console.error('getBySubdomain getPageData error:', e);
      return res.status(200).json({ success: true, data: { content: null }, subdomain: domain.subdomain });
    }
    if (!draft || !draft.content) {
      return res.status(200).json({ success: true, data: { content: null }, subdomain: domain.subdomain });
    }
    res.status(200).json({
      success: true,
      data: { content: draft.content },
      subdomain: domain.subdomain,
      projectTitle: domain.projectTitle,
    });
  } catch (error) {
    console.error('getBySubdomain error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
