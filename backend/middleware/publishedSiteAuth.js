const jwt = require('jsonwebtoken');
const Domain = require('../models/Domain');
const PublishedSiteUser = require('../models/PublishedSiteUser');

const SITE_COOKIE_NAME = 'mercato_site_token';

function readSiteIdentifier(req) {
  const headerIdentifier = req.headers['x-site-identifier'];
  if (typeof headerIdentifier === 'string' && headerIdentifier.trim()) {
    return headerIdentifier.trim().toLowerCase();
  }

  const bodyIdentifier = req.body?.siteIdentifier;
  if (typeof bodyIdentifier === 'string' && bodyIdentifier.trim()) {
    return bodyIdentifier.trim().toLowerCase();
  }

  const queryIdentifier = req.query?.siteIdentifier;
  if (typeof queryIdentifier === 'string' && queryIdentifier.trim()) {
    return queryIdentifier.trim().toLowerCase();
  }

  if (typeof req.siteIdentifier === 'string' && req.siteIdentifier.trim()) {
    return req.siteIdentifier.trim().toLowerCase();
  }

  if (typeof req.params?.subdomain === 'string' && req.params.subdomain.trim()) {
    return req.params.subdomain.trim().toLowerCase();
  }

  return '';
}

async function resolvePublishedSite(req) {
  const identifier = readSiteIdentifier(req);
  if (!identifier) return null;

  if (identifier.includes('.')) {
    return Domain.findByCustomDomain(identifier);
  }

  return Domain.findBySubdomain(identifier);
}

async function protectPublishedSiteUser(req, res, next) {
  const token =
    req.cookies?.[SITE_COOKIE_NAME] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no published-site session found' });
  }

  const site = await resolvePublishedSite(req);
  if (!site || !site.subdomain) {
    return res.status(404).json({ success: false, message: 'Published site not found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'published_site_user' || decoded.subdomain !== site.subdomain) {
      return res.status(401).json({ success: false, message: 'Not authorized for this published site' });
    }

    const user = await PublishedSiteUser.get(site.subdomain, decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Published-site user not found' });
    }
    if (user.isActive === false || String(user.status || '').toLowerCase() === 'disabled') {
      return res.status(403).json({ success: false, message: 'This published-site account is disabled' });
    }

    req.publishedSite = site;
    req.publishedUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid published-site session' });
  }
}

module.exports = {
  SITE_COOKIE_NAME,
  readSiteIdentifier,
  resolvePublishedSite,
  protectPublishedSiteUser,
};
