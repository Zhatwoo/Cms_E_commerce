export const SUBSCRIPTION_LIMITS = {
    free: {
        domains: 3,
        projects: 5,
        codeEditor: false,
        storageLimit: 1 * 1024 * 1024 * 1024,
    },
    basic: {
        domains: 10,
        projects: 10,
        codeEditor: true,
        storageLimit: 3 * 1024 * 1024 * 1024,
    },
    pro: {
        domains: Infinity,
        projects: Infinity,
        codeEditor: true,
        storageLimit: 10 * 1024 * 1024 * 1024,
    },
    custom: {
        domains: Infinity,
        projects: Infinity,
        codeEditor: true,
        storageLimit: Infinity,
    },
};

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'custom';

export function getLimits(plan?: string) {
    const p = (plan || 'free').toLowerCase() as SubscriptionPlan;
    return SUBSCRIPTION_LIMITS[p] || SUBSCRIPTION_LIMITS.free;
}
