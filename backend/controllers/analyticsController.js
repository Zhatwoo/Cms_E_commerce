const WebsiteAnalytics = require('../models/WebsiteAnalytics');
const Domain = require('../models/Domain');
const log = require('../utils/logger')('analyticsController');

function buildAnalyticsKeys(domainData, normalizedSubdomain) {
  return Array.from(new Set([
    String(domainData?.id || '').trim(),
    String(domainData?.projectId || '').trim(),
    String(normalizedSubdomain || '').trim(),
  ].filter(Boolean)));
}

// @desc    Track a page view for a published website (public endpoint)
// @route   POST /api/analytics/track-view
// @access  Public
exports.trackPageView = async (req, res) => {
  try {
    // Try to get subdomain from either request body or from middleware detection
    let subdomain = req.body?.subdomain || req.siteIdentifier;

    if (!subdomain) {
      log.debug(`[Analytics] No subdomain found in body or middleware`);
      return res.status(200).json({
        success: true,
        message: 'No subdomain provided'
      });
    }

    // Normalize subdomain
    const normalized = String(subdomain).toLowerCase().replace(/[^a-z0-9-]/g, '');

    if (!normalized) {
      log.debug(`[Analytics] Normalized subdomain is empty`);
      return res.status(200).json({
        success: true,
        message: 'Invalid subdomain'
      });
    }

    try {
      // Use the same lookup method as the public site controller
      const domainData = await Domain.findBySubdomain(normalized);
      
      if (!domainData || !domainData.id) {
        log.debug(`[Analytics] Subdomain "${normalized}" not found or not published`);
        // Site not found or not published - silently succeed
        return res.status(200).json({
          success: true,
          message: 'View tracking processed'
        });
      }

      log.debug(`[Analytics] Found domain ID: ${domainData.id} for subdomain: ${normalized}`);
      
      // Track the view using the domain ID
      const viewData = {
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        referer: req.headers['referer'] || ''
      };

      const canonicalSubdomain = String(domainData.subdomain || normalized || '').trim().toLowerCase();
      let canonicalDomainId = String(domainData.id || '').trim();
      if (canonicalSubdomain) {
        try {
          const publishedDomain = await Domain.findByPublishedSubdomain(canonicalSubdomain);
          if (publishedDomain?.id) canonicalDomainId = String(publishedDomain.id).trim();
        } catch (_e) {
          // Best effort only
        }
      }

      const keys = new Set([
        ...buildAnalyticsKeys(domainData, canonicalSubdomain),
        canonicalDomainId,
      ]);

      await Promise.all(Array.from(keys).map((key) => WebsiteAnalytics.trackView(key, viewData)));
      
      log.debug(`[Analytics] View tracked successfully for domain ID: ${domainData.id}`);

      res.status(200).json({
        success: true,
        message: 'View tracked'
      });
    } catch (error) {
      log.error('Error tracking view:', error);
      // Still return success so the website doesn't break
      res.status(200).json({
        success: true,
        message: 'View tracking processed'
      });
    }
  } catch (error) {
    log.error('trackPageView Error:', error);
    // Return success to avoid blocking the site
    res.status(200).json({
      success: true,
      message: 'View tracking processed'
    });
  }
};
