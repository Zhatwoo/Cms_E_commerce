// Public (no auth): get published site content by subdomain for live site viewer
const Domain = require('../models/Domain');
const Product = require('../models/Product');

const MIGRATIONS = [
  ['Create Beautiful Websites', 'Welcome to Our Website'],
  ['Our visual builder makes it easy to create stunning websites without writing a single line of code.', "We're here to help you discover what you need. Browse our offerings and get in touch."],
  ['Start Building', 'Learn More'],
  ['"Excellent service and support. Highly recommended!"', '"Quality products and great experience. Will definitely be back."'],
  ['John Doe', 'Happy Customer'],
  ['CEO, Company Name', 'Verified Buyer'],
  ['JD', 'HC'],
];

function migrateContent(val) {
  if (typeof val === 'string') {
    let out = val;
    for (const [oldText, newText] of MIGRATIONS) {
      if (out.includes(oldText)) out = out.split(oldText).join(newText);
    }
    return out;
  }
  if (Array.isArray(val)) return val.map(migrateContent);
  if (val && typeof val === 'object' && val.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = migrateContent(v);
    return out;
  }
  return val;
}

exports.getBySubdomain = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    const identifier = req.siteIdentifier || (req.params.subdomain || '').toString().trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Subdomain or domain is required' });
    }

    let domain = null;
    if (req.isCustomDomain) {
      domain = await Domain.findByCustomDomain(identifier);
    } else {
      domain = await Domain.findBySubdomain(identifier);
    }

    if (!domain || !domain.userId || !domain.projectId) {
      return res.status(404).json({ success: false, message: 'Site not found. Publish from Preview or sync domains in Dashboard.' });
    }

    // Serve the published snapshot with migration for old default template text
    const raw = domain.publishedContent ?? null;
    // Normalize: if content is a string, parse it to an object so the frontend
    // always receives a plain object (handles both string and map storage formats)
    let parsedRaw = raw;
    if (typeof raw === 'string') {
      try { parsedRaw = JSON.parse(raw); } catch { parsedRaw = raw; }
    }
    const content = parsedRaw ? migrateContent(parsedRaw) : null;
    res.status(200).json({
      success: true,
      data: { content },
      subdomain: domain.subdomain,
      projectTitle: domain.projectTitle,
      owner: domain.owner || null,
    });
  } catch (error) {
    console.error('getBySubdomain error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Public: list products for storefront (published/active only)
exports.getProducts = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
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
