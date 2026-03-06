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

const PLAN_DISPLAY_NAMES: Record<SubscriptionPlan, string> = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Premium',
    custom: 'Custom',
};

export function getSubscriptionPlanDisplayName(plan?: string) {
    const normalized = (plan || 'free').toLowerCase() as SubscriptionPlan;
    if (PLAN_DISPLAY_NAMES[normalized]) return PLAN_DISPLAY_NAMES[normalized];

    const fallback = (plan || 'free').toString().trim().toLowerCase();
    if (!fallback) return 'Free';
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}

export function getLimits(plan?: string) {
    const p = (plan || 'free').toLowerCase() as SubscriptionPlan;
    return SUBSCRIPTION_LIMITS[p] || SUBSCRIPTION_LIMITS.free;
}
