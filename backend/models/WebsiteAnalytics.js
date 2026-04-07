const { db, admin } = require('../config/firebase');
const { docToObject } = require('../utils/firestoreHelper');
const FieldValue = admin.firestore.FieldValue;

const COLLECTION = 'website_analytics';

/**
 * Get analytics document reference for a website
 * Path: website_analytics/{domainId}
 */
function getAnalyticsRef(domainId) {
  return db.collection(COLLECTION).doc(domainId);
}

/**
 * Track a page view for a website
 * @param {string} domainId - The domain/website ID
 * @param {object} viewData - Optional view metadata
 * @returns {Promise<void>}
 */
async function trackView(domainId, viewData = {}) {
  if (!domainId) throw new Error('domainId is required');

  const now = new Date();
  const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const monthKey = now.toISOString().slice(0, 7); // YYYY-MM

  const analyticsRef = getAnalyticsRef(domainId);

  try {
    await analyticsRef.update({
      totalViews: FieldValue.increment(1),
      [`dailyViews.${dateKey}`]: FieldValue.increment(1),
      [`monthlyViews.${monthKey}`]: FieldValue.increment(1),
      lastViewedAt: FieldValue.serverTimestamp(),
      viewerIp: viewData.ip || null,
      viewerUserAgent: viewData.userAgent || null,
      viewerReferer: viewData.referer || null,
    });
  } catch (error) {
    // Document might not exist, try creating it
    if (error.code === 'NOT_FOUND' || error.message.includes('No document to update')) {
      const dateKey = now.toISOString().split('T')[0];
      const monthKey = now.toISOString().slice(0, 7);
      
      await analyticsRef.set({
        domainId,
        totalViews: 1,
        dailyViews: { [dateKey]: 1 },
        monthlyViews: { [monthKey]: 1 },
        errors: 0,
        reports: 0,
        createdAt: FieldValue.serverTimestamp(),
        lastViewedAt: FieldValue.serverTimestamp(),
        viewerIp: viewData.ip || null,
        viewerUserAgent: viewData.userAgent || null,
        viewerReferer: viewData.referer || null,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Track an error on a website
 * @param {string} domainId - The domain/website ID
 * @param {string} errorMessage - Error message
 * @param {object} errorData - Additional error metadata
 */
async function trackError(domainId, errorMessage = '', errorData = {}) {
  if (!domainId) throw new Error('domainId is required');

  const analyticsRef = getAnalyticsRef(domainId);
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];

  try {
    await analyticsRef.update({
      errors: FieldValue.increment(1),
      [`dailyErrors.${dateKey}`]: FieldValue.increment(1),
      lastErrorAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND' || error.message.includes('No document to update')) {
      await analyticsRef.set({
        domainId,
        totalViews: 0,
        dailyViews: {},
        monthlyViews: {},
        errors: 1,
        reports: 0,
        dailyErrors: { [dateKey]: 1 },
        createdAt: FieldValue.serverTimestamp(),
        lastErrorAt: FieldValue.serverTimestamp(),
      });
    } else {
      throw error;
    }
  }
}

/**
 * Track a report on a website
 * @param {string} domainId - The domain/website ID
 * @param {string} reportReason - Report reason
 */
async function trackReport(domainId, reportReason = '') {
  if (!domainId) throw new Error('domainId is required');

  const analyticsRef = getAnalyticsRef(domainId);
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];

  try {
    await analyticsRef.update({
      reports: FieldValue.increment(1),
      [`dailyReports.${dateKey}`]: FieldValue.increment(1),
      lastReportedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND' || error.message.includes('No document to update')) {
      await analyticsRef.set({
        domainId,
        totalViews: 0,
        dailyViews: {},
        monthlyViews: {},
        errors: 0,
        reports: 1,
        dailyReports: { [dateKey]: 1 },
        createdAt: FieldValue.serverTimestamp(),
        lastReportedAt: FieldValue.serverTimestamp(),
      });
    } else {
      throw error;
    }
  }
}

/**
 * Get analytics for a website
 * @param {string} domainId - The domain/website ID
 * @returns {Promise<object>}
 */
async function getAnalytics(domainId) {
  if (!domainId) throw new Error('domainId is required');
  
  const snap = await getAnalyticsRef(domainId).get();
  
  if (!snap.exists) {
    return {
      domainId,
      totalViews: 0,
      errors: 0,
      reports: 0,
      dailyViews: {},
      monthlyViews: {},
      dailyErrors: {},
      dailyReports: {},
    };
  }

  return docToObject(snap);
}

/**
 * Get analytics for multiple websites
 * @param {array} domainIds - Array of domain/website IDs
 * @returns {Promise<object>} Map of domainId -> analytics
 */
async function getAnalyticsBatch(domainIds) {
  if (!Array.isArray(domainIds) || domainIds.length === 0) {
    return {};
  }

  try {
    const result = {};
    const chunks = [];
    
    // Firestore has a max of 10 documents per query, so chunk the request
    for (let i = 0; i < domainIds.length; i += 10) {
      chunks.push(domainIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const snap = await db.collection(COLLECTION)
        .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
        .get();

      snap.docs.forEach((doc) => {
        result[doc.id] = docToObject(doc);
      });
    }

    // Fill in missing domains with default values
    domainIds.forEach((id) => {
      if (!result[id]) {
        result[id] = {
          domainId: id,
          totalViews: 0,
          errors: 0,
          reports: 0,
          dailyViews: {},
          monthlyViews: {},
          dailyErrors: {},
          dailyReports: {},
        };
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting batch analytics:', error);
    const result = {};
    domainIds.forEach((id) => {
      result[id] = {
        domainId: id,
        totalViews: 0,
        errors: 0,
        reports: 0,
        dailyViews: {},
        monthlyViews: {},
        dailyErrors: {},
        dailyReports: {},
      };
    });
    return result;
  }
}

/**
 * Reset analytics for a website
 * @param {string} domainId - The domain/website ID
 */
async function resetAnalytics(domainId) {
  if (!domainId) throw new Error('domainId is required');
  
  await getAnalyticsRef(domainId).delete();
}

module.exports = {
  trackView,
  trackError,
  trackReport,
  getAnalytics,
  getAnalyticsBatch,
  resetAnalytics,
};
