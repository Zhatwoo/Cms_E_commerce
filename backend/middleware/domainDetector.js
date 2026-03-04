// middleware/domainDetector.js

/**
 * Middleware to detect the current site context (subdomain or custom domain).
 * Attaches req.siteUID and req.isCustomDomain to the request object.
 */
const domainDetector = (req, res, next) => {
    const host = req.headers.host || '';
    const baseDomain = process.env.BASE_DOMAIN || 'localhost:5000'; // Fallback for dev

    // Normalize host (remove port if present for comparison)
    const hostWithoutPort = host.split(':')[0];
    const baseWithoutPort = baseDomain.split(':')[0];

    if (hostWithoutPort.endsWith(baseWithoutPort) && hostWithoutPort !== baseWithoutPort) {
        // Subdomain detection: e.g. alice.yourplatform.com
        const parts = hostWithoutPort.split('.');
        // If base is yourplatform.com, parts might be ['alice', 'yourplatform', 'com']
        // We want the part before the base domain
        const baseParts = baseWithoutPort.split('.');
        const subdomain = parts.slice(0, parts.length - baseParts.length).join('.');

        req.siteIdentifier = subdomain;
        req.isCustomDomain = false;
    } else if (hostWithoutPort !== baseWithoutPort && hostWithoutPort !== 'localhost' && hostWithoutPort !== '127.0.0.1') {
        // Custom domain detection: e.g. alicebiz.com
        req.siteIdentifier = hostWithoutPort;
        req.isCustomDomain = true;
    } else {
        // Main platform access
        req.siteIdentifier = null;
        req.isCustomDomain = false;
    }

    next();
};

module.exports = domainDetector;
