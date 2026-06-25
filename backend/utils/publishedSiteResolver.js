// utils/publishedSiteResolver.js
// Shared helpers for resolving the active published site from a request.
const Domain = require('../models/Domain');

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

module.exports = {
  SITE_COOKIE_NAME,
  readSiteIdentifier,
  resolvePublishedSite,
};
