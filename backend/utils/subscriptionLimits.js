const SUBSCRIPTION_LIMITS = {
    free: {
        domains: 3,
        projects: 5,
        codeEditor: false,
    },
    basic: {
        domains: 10,
        projects: 10,
        codeEditor: false,
    },
    pro: {
        domains: Infinity,
        projects: Infinity,
        codeEditor: true,
    },
    custom: {
        domains: Infinity,
        projects: Infinity,
        codeEditor: true,
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
