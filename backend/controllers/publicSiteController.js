// Public (no auth): get published site content by subdomain for live site viewer
const Domain = require('../models/Domain');
const Product = require('../models/Product');
const WebsiteAnalytics = require('../models/WebsiteAnalytics');

function buildAnalyticsKeys(domain, canonicalSubdomain) {
  return Array.from(new Set([
    String(domain?.id || '').trim(),
    String(domain?.projectId || '').trim(),
    String(canonicalSubdomain || '').trim(),
  ].filter(Boolean)));
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

    // Server-side view tracking fallback so visits are counted even if client-side tracking fails.
    // Resolve a canonical analytics key from published_subdomains to match admin dashboard IDs.
    const canonicalSubdomain = String(domain.subdomain || (!req.isCustomDomain ? identifier : '') || '').trim().toLowerCase();
    let analyticsDomainId = domain.id || null;
    if (canonicalSubdomain) {
      try {
        const publishedDomain = await Domain.findByPublishedSubdomain(canonicalSubdomain);
        if (publishedDomain?.id) analyticsDomainId = publishedDomain.id;
      } catch (e) {
        // Best effort only; keep fallback analyticsDomainId.
      }
    }

    if (analyticsDomainId) {
      const viewData = {
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        referer: req.headers['referer'] || ''
      };

      const keys = new Set([
        ...buildAnalyticsKeys(domain, canonicalSubdomain),
        String(analyticsDomainId || '').trim(),
      ]);

      console.log(`[Analytics] Server-side track for subdomain "${canonicalSubdomain || domain.subdomain || 'unknown'}" using keys: ${Array.from(keys).join(', ')}`);

      Promise.all(Array.from(keys).map((key) => WebsiteAnalytics.trackView(key, viewData)))
        .catch((err) => console.error('getBySubdomain trackView error:', err.message));
    }

    // Serve the published snapshot exactly as authored during publish.
    const raw = domain.publishedContent ?? null;
    // Normalize: if content is a string, parse it to an object so the frontend
    // always receives a plain object (handles both string and map storage formats)
    let parsedRaw = raw;
    if (typeof raw === 'string') {
      try { parsedRaw = JSON.parse(raw); } catch { parsedRaw = raw; }
    }
    const content = parsedRaw ?? null;
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
