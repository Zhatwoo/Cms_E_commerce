'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';
import { Check, Zap, Crown, Settings } from 'lucide-react';
import { getStoredUser } from '@/lib/api';
import { SUBSCRIPTION_LIMITS, type SubscriptionPlan } from '@/lib/subscriptionLimits';

export default function SubscriptionPage() {
    const { colors, theme } = useTheme();
    const { showAlert } = useAlert();
    const user = getStoredUser();
    const currentPlan = (user?.subscriptionPlan || 'free').toLowerCase() as SubscriptionPlan;

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            description: 'Perfect for getting started',
            icon: Zap,
            color: 'blue',
            features: [
                'Up to 5 Projects',
                'Up to 3 Domains',
                'Basic Templates',
                'Community Support',
            ],
            limitKey: 'free',
        },
        {
            id: 'basic',
            name: 'Basic',
            price: '$19',
            description: 'Ideal for growing sites',
            icon: Zap,
            color: 'emerald',
            features: [
                'Up to 10 Projects',
                'Up to 10 Domains',
                'All Templates',
                'Email Support',
            ],
            featured: true,
            limitKey: 'basic',
        },
        {
            id: 'pro',
            name: 'Professional',
            price: '$49',
            description: 'Best for power users',
            icon: Crown,
            color: 'purple',
            features: [
                'Unlimited Projects',
                'Unlimited Domains',
                'Code Editor Access',
                'Priority Support',
                'Advanced Analytics',
            ],
            limitKey: 'pro',
        },
        {
            id: 'custom',
            name: 'Customize',
            price: 'Custom',
            description: 'Enterprise & Bespoke',
            icon: Settings,
            color: 'amber',
            features: [
                'Custom Limits',
                'Dedicated Account Manager',
                'SLA Guarantee',
                'Custom Integrations',
                'White-label options',
            ],
            limitKey: 'custom',
        }
    ];

    return (
        <div className="space-y-8 pb-12">
            <section className="text-center space-y-4">
                <motion.h1
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: colors.text.primary }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Subscription Plans
                </motion.h1>
                <motion.p
                    className="text-lg max-w-2xl mx-auto"
                    style={{ color: colors.text.secondary }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    Choose the plan that's right for your business. Upgrade or downgrade at any time.
                </motion.p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {plans.map((plan, idx) => {
                    const Icon = plan.icon;
                    const isCurrent = currentPlan === plan.id;

                    return (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative rounded-3xl border p-8 flex flex-col h-full overflow-hidden ${plan.featured ? 'ring-2 ring-blue-500 scale-105 z-10' : ''}`}
                            style={{
                                backgroundColor: colors.bg.card,
                                borderColor: plan.featured ? colors.status.info : colors.border.faint,
                                boxShadow: theme === 'dark' ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)'
                            }}
                        >
                            {plan.featured && (
                                <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-xl bg-blue-500 text-white text-xs font-bold uppercase tracking-wider">
                                    Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-blue-500/10 text-blue-500`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{plan.name}</h3>
                                <p className="text-sm mt-1" style={{ color: colors.text.muted }}>{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <span className="text-4xl font-bold" style={{ color: colors.text.primary }}>{plan.price}</span>
                                {plan.price !== 'Custom' && <span className="text-sm ml-1" style={{ color: colors.text.muted }}>/month</span>}
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <Check size={12} className="text-emerald-500" />
                                        </div>
                                        <span className="text-sm" style={{ color: colors.text.secondary }}>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => isCurrent ? null : showAlert(`Upgrading to ${plan.name} is coming soon!`)}
                                disabled={isCurrent}
                                className={`w-full py-4 rounded-2xl font-bold transition-all ${isCurrent
                                        ? 'cursor-default border-2'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                                    }`}
                                style={isCurrent ? { borderColor: colors.border.faint, color: colors.text.muted } : {}}
                            >
                                {isCurrent ? 'Current Plan' : plan.price === 'Custom' ? 'Contact Sales' : 'Upgrade Now'}
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            {/* Comparison Table or Extra Info */}
            <section
                className="mt-12 rounded-3xl border p-8 mx-4"
                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
            >
                <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>Plan Comparison Details</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b" style={{ borderColor: colors.border.faint }}>
                                <th className="py-4 font-semibold text-sm px-2" style={{ color: colors.text.muted }}>Feature</th>
                                <th className="py-4 font-semibold text-sm px-2" style={{ color: colors.text.muted }}>Free</th>
                                <th className="py-4 font-semibold text-sm px-2" style={{ color: colors.text.muted }}>Basic</th>
                                <th className="py-4 font-semibold text-sm px-2" style={{ color: colors.text.muted }}>Pro</th>
                                <th className="py-4 font-semibold text-sm px-2" style={{ color: colors.text.muted }}>Customize</th>
                            </tr>
                        </thead>
                        <tbody style={{ color: colors.text.primary }}>
                            <tr className="border-b transition-colors hover:bg-white/5" style={{ borderColor: colors.border.faint }}>
                                <td className="py-4 text-sm font-medium px-2">Domain Limit</td>
                                <td className="py-4 text-sm px-2">{SUBSCRIPTION_LIMITS.free.domains}</td>
                                <td className="py-4 text-sm font-bold text-blue-500 px-2">{SUBSCRIPTION_LIMITS.basic.domains}</td>
                                <td className="py-4 text-sm px-2">Unlimited</td>
                                <td className="py-4 text-sm italic px-2">Custom</td>
                            </tr>
                            <tr className="border-b transition-colors hover:bg-white/5" style={{ borderColor: colors.border.faint }}>
                                <td className="py-4 text-sm font-medium px-2">Project Limit</td>
                                <td className="py-4 text-sm px-2">{SUBSCRIPTION_LIMITS.free.projects}</td>
                                <td className="py-4 text-sm px-2">{SUBSCRIPTION_LIMITS.basic.projects}</td>
                                <td className="py-4 text-sm px-2">Unlimited</td>
                                <td className="py-4 text-sm italic px-2">Custom</td>
                            </tr>
                            <tr className="border-b transition-colors hover:bg-white/5" style={{ borderColor: colors.border.faint }}>
                                <td className="py-4 text-sm font-medium px-2">Code Editor</td>
                                <td className="py-4 text-sm text-red-500/50 px-2">Disabled</td>
                                <td className="py-4 text-sm text-red-500/50 px-2">Disabled</td>
                                <td className="py-4 text-sm text-emerald-500 font-bold px-2">Full Access</td>
                                <td className="py-4 text-sm text-emerald-500 font-bold px-2">Enabled</td>
                            </tr>
                            <tr className="transition-colors hover:bg-white/5">
                                <td className="py-4 text-sm font-medium px-2">Support</td>
                                <td className="py-4 text-sm text-zinc-500 px-2">Community</td>
                                <td className="py-4 text-sm text-zinc-500 px-2">Email</td>
                                <td className="py-4 text-sm font-medium px-2">Priority</td>
                                <td className="py-4 text-sm font-bold text-amber-500 px-2">Dedicated</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
