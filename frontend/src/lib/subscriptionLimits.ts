export const SUBSCRIPTION_LIMITS = {
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

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'custom';

export function getLimits(plan?: string) {
    const p = (plan || 'free').toLowerCase() as SubscriptionPlan;
    return SUBSCRIPTION_LIMITS[p] || SUBSCRIPTION_LIMITS.free;
}
