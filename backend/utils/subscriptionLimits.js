const SUBSCRIPTION_LIMITS = {
    free: {
        domains: 3,
        projects: 5,
        codeEditor: false,
        customDomains: false,
        storageLimit: 1 * 1024 * 1024 * 1024, // 1GB
    },
    basic: {
        domains: 10,
        projects: 10,
        codeEditor: false,
        customDomains: true,
        storageLimit: 3 * 1024 * 1024 * 1024, // 3GB
    },
    pro: {
        domains: Infinity,
        projects: Infinity,
        codeEditor: true,
        customDomains: true,
        storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
    },
    custom: {
        domains: Infinity,
        projects: Infinity,
        codeEditor: true,
        customDomains: true,
        storageLimit: Infinity, // Custom storage
    },
};

/**
 * Get limits for a given subscription plan.
 * @param {string} plan 
 * @returns {object}
 */
function getLimits(plan) {
    const p = (plan || 'free').toLowerCase();
    return SUBSCRIPTION_LIMITS[p] || SUBSCRIPTION_LIMITS.free;
}

module.exports = {
    SUBSCRIPTION_LIMITS,
    getLimits,
};
