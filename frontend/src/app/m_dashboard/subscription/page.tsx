'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useAlert } from '../components/context/alert-context';
import { Check } from 'lucide-react';
import { getStoredUser } from '@/lib/api';
import { SUBSCRIPTION_LIMITS, type SubscriptionPlan } from '@/lib/subscriptionLimits';

export default function SubscriptionPage() {
    const { showAlert } = useAlert();
    const user = getStoredUser();
    const currentPlan = (user?.subscriptionPlan || 'free').toLowerCase() as SubscriptionPlan;

    const plans = [
        {
            id: 'free',
            name: 'Starter',
            price: '0',
            period: '/first month',
            description: 'Try Finding Neo completely risk-free for 30 days.',
            accent: 'violet',
            features: [
                '1 Free Custom Domain',
                'Up to 100 Products',
                'Visual Canvas Editor',
                'Community Support',
            ],
        },
        {
            id: 'basic',
            name: 'Standard',
            price: '199',
            period: '/month',
            description: 'Perfect for starters and small teams.',
            accent: 'violet',
            features: [
                '1 Custom Domain',
                'Up to 500 Products',
                'Basic Analytics',
                '24/7 Email Support',
            ],
        },
        {
            id: 'pro',
            name: 'Premium',
            price: '499',
            period: '/month',
            description: 'For growing businesses needing more power.',
            accent: 'gold',
            features: [
                'Unlimited Domains',
                'Unlimited Products',
                'Advanced Analytics & Reporting',
                'Priority 24/7 Support',
                'API Access & Webhooks',
            ],
        },
        {
            id: 'custom',
            name: 'Custom',
            price: 'Custom',
            period: '',
            description: 'Enterprise & Bespoke',
            accent: 'gold',
            features: [
                'Custom Limits',
                'Dedicated Account Manager',
                'SLA Guarantee',
                'Custom Integrations',
                'White-label options',
            ],
        }
    ];

    return (
        <section className="w-full px-4 pb-20 pt-10 md:px-8 md:pb-24 md:pt-12">
            <div className="mx-auto max-w-[1320px]">
            <section className="mx-auto max-w-[760px] text-center">
                <motion.h1
                    className="text-[38px] font-black leading-[1.08] tracking-[-0.02em] bg-gradient-to-r from-[#8b3dff] via-[#c026d3] to-[#f5c400] bg-clip-text text-transparent md:text-[58px]"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Subscription Plans
                </motion.h1>
                <motion.p
                    className="mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.35] text-white/50 md:text-[15px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    Choose the plan that's right for your business. Upgrade or downgrade at any time.
                </motion.p>
            </section>

            {currentPlan === 'custom' && (
                <div className="mt-8 rounded-2xl border border-[#f5c400] bg-[#111058] px-5 py-3 text-sm text-[#f5c400]">
                    You are currently on a Custom enterprise plan.
                </div>
            )}

            <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-2 xl:grid-cols-4 md:gap-7">
                {plans.map((plan, idx) => {
                    const isCurrent = currentPlan === plan.id;
                    const isGoldAccent = plan.accent === 'gold';

                    const ringClass = isGoldAccent
                        ? 'border-[3px] border-[#f5c400]'
                        : 'border border-[#3d2a93]';

                    const titleClass = isGoldAccent ? 'text-[#f0bb00]' : 'text-[#8b3dff]';
                    const checkClass = isGoldAccent ? 'text-[#f5c400]' : 'text-[#a855f7]';
                    const buttonClass = isCurrent
                        ? 'border border-[#3d2a93] text-white/55 cursor-default'
                        : isGoldAccent
                            ? 'bg-[#f5c400] text-[#1c1d2b] hover:brightness-105'
                            : 'bg-gradient-to-r from-[#8b3dff] to-[#c026d3] text-white hover:brightness-110';

                    return (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative h-full rounded-[2rem] p-7 md:min-h-[500px] md:p-8 ${ringClass} bg-[#111058] shadow-[8px_10px_20px_rgba(5,3,39,0.55)]`}
                        >
                            <div className="flex h-full flex-col">
                            <div>
                                <h3 className={`text-[35px] font-extrabold leading-none ${titleClass}`}>{plan.name}</h3>

                                <div className="mt-3 flex items-end gap-2 leading-none">
                                    {plan.price !== 'Custom' && <span className="mb-1 text-[30px] font-bold text-white">₱</span>}
                                    <span className="text-[58px] font-extrabold tracking-tight text-white">{plan.price}</span>
                                    {plan.price !== 'Custom' && <span className="mb-1 text-[16px] font-medium text-white/55">{plan.period}</span>}
                                </div>

                                <p className="mt-4 min-h-[56px] text-[15px] leading-[1.25] text-white/60">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mt-5 space-y-3 text-[15px] text-white/88 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Check size={14} className={`mt-0.5 shrink-0 ${checkClass}`} />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => isCurrent ? null : showAlert(`Upgrading to ${plan.name} is coming soon!`)}
                                disabled={isCurrent}
                                className={`mt-auto w-full whitespace-nowrap rounded-full px-7 py-3 text-[16px] font-extrabold leading-none transition ${buttonClass}`}
                            >
                                {isCurrent ? 'Current Plan' : plan.id === 'custom' ? 'Contact Sales' : `Select ${plan.name}`}
                            </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <section
                className="mt-12 rounded-[2rem] border border-[#3d2a93] bg-[#111058] p-8"
            >
                <h2 className="mb-6 text-2xl font-bold text-white">Plan Comparison Details</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#3d2a93] text-white/55">
                                <th className="px-2 py-4 text-sm font-semibold">Feature</th>
                                <th className="px-2 py-4 text-sm font-semibold">Starter</th>
                                <th className="px-2 py-4 text-sm font-semibold">Standard</th>
                                <th className="px-2 py-4 text-sm font-semibold">Premium</th>
                                <th className="px-2 py-4 text-sm font-semibold">Custom</th>
                            </tr>
                        </thead>
                        <tbody className="text-white">
                            <tr className="border-b border-[#3d2a93] transition-colors hover:bg-white/5">
                                <td className="px-2 py-4 text-sm font-medium">Domain Limit</td>
                                <td className="px-2 py-4 text-sm">{SUBSCRIPTION_LIMITS.free.domains}</td>
                                <td className="px-2 py-4 text-sm font-bold text-[#8b3dff]">{SUBSCRIPTION_LIMITS.basic.domains}</td>
                                <td className="px-2 py-4 text-sm">Unlimited</td>
                                <td className="px-2 py-4 text-sm italic">Custom</td>
                            </tr>
                            <tr className="border-b border-[#3d2a93] transition-colors hover:bg-white/5">
                                <td className="px-2 py-4 text-sm font-medium">Project Limit</td>
                                <td className="px-2 py-4 text-sm">{SUBSCRIPTION_LIMITS.free.projects}</td>
                                <td className="px-2 py-4 text-sm">{SUBSCRIPTION_LIMITS.basic.projects}</td>
                                <td className="px-2 py-4 text-sm">Unlimited</td>
                                <td className="px-2 py-4 text-sm italic">Custom</td>
                            </tr>
                            <tr className="border-b border-[#3d2a93] transition-colors hover:bg-white/5">
                                <td className="px-2 py-4 text-sm font-medium">Code Editor</td>
                                <td className="px-2 py-4 text-sm text-red-400/60">Disabled</td>
                                <td className="px-2 py-4 text-sm text-red-400/60">Disabled</td>
                                <td className="px-2 py-4 text-sm font-bold text-emerald-400">Full Access</td>
                                <td className="px-2 py-4 text-sm font-bold text-emerald-400">Enabled</td>
                            </tr>
                            <tr className="transition-colors hover:bg-white/5">
                                <td className="px-2 py-4 text-sm font-medium">Support</td>
                                <td className="px-2 py-4 text-sm text-white/65">Community</td>
                                <td className="px-2 py-4 text-sm text-white/65">Email</td>
                                <td className="px-2 py-4 text-sm font-medium">Priority</td>
                                <td className="px-2 py-4 text-sm font-bold text-[#f5c400]">Dedicated</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
            </div>
        </section>
    );
}
