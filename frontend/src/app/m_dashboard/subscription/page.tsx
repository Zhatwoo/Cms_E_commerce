'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';
import { getStoredUser } from '@/lib/api';
import { SUBSCRIPTION_LIMITS, type SubscriptionPlan } from '@/lib/subscriptionLimits';
import { Check } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanId = 'free' | 'basic' | 'pro' | 'custom';

type PlanItem = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  limitSummary: string;
  accent: string;
  glow: string;
  badge?: string;
  isPremium?: boolean;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLAN_ORDER: PlanId[] = ['free', 'basic', 'pro', 'custom'];

const PLANS: PlanItem[] = [
  {
    id: 'free',
    name: 'Starter',
    price: '0',
    period: '/first month',
    tagline: 'Try Centric completely risk-free for 30 days.',
    features: ['1 Free Custom Domain', 'Up to 100 Products', 'Visual Canvas Editor', 'Community Support'],
    limitSummary: `${SUBSCRIPTION_LIMITS.free.projects} projects · ${SUBSCRIPTION_LIMITS.free.domains} domain`,
    accent: '#9333ea',
    glow: 'rgba(147,51,234,0.15)',
  },
  {
    id: 'basic',
    name: 'Standard',
    price: '199',
    period: '/month',
    tagline: 'Perfect for starters and small teams.',
    features: ['1 Custom Domain', 'Up to 500 Products', 'Code Editor Access', 'Priority 24/7 Support'],
    limitSummary: `${SUBSCRIPTION_LIMITS.basic.projects} projects · ${SUBSCRIPTION_LIMITS.basic.domains} domain`,
    accent: '#9333ea',
    glow: 'rgba(147,51,234,0.15)',
  },
  {
    id: 'pro',
    name: 'Premium',
    price: '499',
    period: '/month',
    tagline: 'For growing businesses needing more power.',
    features: ['Unlimited Domains', 'Unlimited Products', 'Priority 24/7 Support', 'Code Editor Access'],
    limitSummary: 'Unlimited projects · Unlimited domains',
    accent: '#d946ef',
    glow: 'rgba(217,70,239,0.15)',
    isPremium: true,
  },
  {
    id: 'custom',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline: 'Tailored for advanced teams & organizations.',
    features: ['Custom Limits', 'Dedicated Manager', 'SLA Guarantee', 'Custom Integrations', 'White-Label'],
    limitSummary: 'Tailored to your scale',
    accent: '#9333ea',
    glow: 'rgba(147,51,234,0.15)',
  },
];

const COMPARISON_ROWS = [
  { label: 'Projects', values: [String(SUBSCRIPTION_LIMITS.free.projects), String(SUBSCRIPTION_LIMITS.basic.projects), 'Unlimited', 'Custom'] },
  { label: 'Domains', values: [String(SUBSCRIPTION_LIMITS.free.domains), String(SUBSCRIPTION_LIMITS.basic.domains), 'Unlimited', 'Custom'] },
  { label: 'Products', values: ['100', '500', 'Unlimited', 'Custom'] },
  { label: 'Code Editor', values: ['—', 'Access', '✓', '✓'] },
  { label: 'Support', values: ['Community', 'Priority', 'Priority', 'Dedicated'] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPlanId(raw: string): PlanId {
  const s = raw.toLowerCase();
  if (s === 'basic' || s === 'pro' || s === 'custom') return s;
  return 'free';
}

function getPlanRank(id: PlanId) {
  return PLAN_ORDER.indexOf(id);
}

function getPlan(id: PlanId): PlanItem {
  return PLANS.find((p) => p.id === id)!;
}

function actionFor(target: PlanId, current: PlanId): 'current' | 'upgrade' | 'downgrade' | 'contact' {
  if (target === current) return 'current';
  if (target === 'custom') return 'contact';
  return getPlanRank(target) > getPlanRank(current) ? 'upgrade' : 'downgrade';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { colors, theme } = useTheme();
  const { showAlert } = useAlert();

  const user = getStoredUser();
  const currentPlan = toPlanId((user?.subscriptionPlan || 'free').toLowerCase() as SubscriptionPlan);
  const currentPlanData = getPlan(currentPlan);

  const [confirmTarget, setConfirmTarget] = React.useState<PlanId | null>(null);

  const isDark = theme === 'dark';

  const handleAction = (targetId: PlanId) => {
    const action = actionFor(targetId, currentPlan);
    if (action === 'current') return;
    if (action === 'contact') {
      showAlert('Our sales team will be in touch shortly.');
      return;
    }
    setConfirmTarget(targetId);
  };

  const confirmAction = () => {
    if (!confirmTarget) return;
    const action = actionFor(confirmTarget, currentPlan);
    const targetName = getPlan(confirmTarget).name;
    if (action === 'upgrade') showAlert(`Upgrade request sent → ${targetName}`);
    else showAlert(`Downgrade request sent → ${targetName}`);
    setConfirmTarget(null);
  };

  const handleCancel = () => {
    if (currentPlan === 'free') {
      showAlert('You are already on Starter.');
      return;
    }
    setConfirmTarget('free');
  };

  return (
    <div
      className="dashboard-landing-light relative min-h-[calc(100vh-176px)] px-3 py-3 sm:px-5 sm:py-4 lg:px-25 [font-family:var(--font-outfit),sans-serif] space-y-5"
      style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
    >
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="text-center py-4">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-[-1.8px] leading-[1.2] [font-family:var(--font-outfit),sans-serif]"
          style={{ color: colors.text.primary }}
        >
          Subscription{' '}
          <span
            className={`inline-block bg-clip-text text-transparent bg-linear-to-r ${isDark ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
            style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
          >
            Plans
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className={`text-base sm:text-lg mt-2 ${isDark ? 'text-[#8A8FC4]' : 'text-[#120533]/70'}`}
        >
          Start free, upgrade as you grow — no lock-ins, no surprises.
        </motion.p>

      </section>

      {/* ── PLAN CARDS ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {PLANS.map((plan, idx) => {
          const action = actionFor(plan.id, currentPlan);
          const isCurrent = action === 'current';
          const isPremium = plan.isPremium;

          // Border: match landing page style
          const borderStyle = isCurrent
            ? (isDark ? '3px solid #FACC15' : `3px solid ${plan.accent}`)
            : isPremium
              ? isDark ? '3px solid #f5c400' : '3px solid #d946ef'
              : isDark ? '1px solid #3d2a93' : '1px solid #c1c1cd';

          // Background: white in light, dark card in dark
          const cardBg = isDark ? '#111058' : '#ffffff';
          const cardShadow = isCurrent
            ? (isDark
              ? '0 20px 40px -10px rgba(5,3,39,0.5), 0 0 0 3px rgba(250,204,21,0.35), 0 0 22px rgba(250,204,21,0.30)'
                : `0 20px 40px -10px rgba(124,58,237,0.1), 0 0 0 3px ${plan.accent}20, 0 0 20px ${plan.accent}15`)
            : (isDark
                ? '0 10px 20px rgba(5,3,39,0.2)'
                : '0 10px 12px rgba(20,20,50,0.03)');

          // Title color
          const titleColor = isPremium
            ? isDark ? '#f0bb00' : '#d946ef'
            : isDark ? '#a78bfa' : '#9333ea';

          // Check color
          const checkColor = isPremium
            ? isDark ? '#f5c400' : '#d946ef'
            : isDark ? '#a855f7' : '#9333ea';

          // CTA button
          let btnBg = '';
          let btnColor = '';
          let btnBorder = '';
          let btnShadow = 'none';
          let btnHoverClass = 'hover:brightness-110';

          if (isCurrent) {
            btnBg = isDark
              ? 'linear-gradient(90deg,#FACC15 0%,#EAB308 100%)'
              : 'linear-gradient(90deg,#9333ea 0%,#ec4899 100%)';
            btnColor = isDark ? '#1c1d2b' : '#ffffff';
            btnBorder = isDark ? '1px solid rgba(250,204,21,0.55)' : '1px solid rgba(217,70,239,0.25)';
            btnShadow = isDark
              ? '0 10px 24px rgba(250,204,21,0.28)'
              : '0 10px 24px rgba(217,70,239,0.28)';
          } else if (action === 'upgrade') {
            if (isPremium) {
              btnBg = isDark ? '#f5c400' : 'linear-gradient(90deg,#9333ea 0%,#ec4899 100%)';
              btnColor = isDark ? '#1c1d2b' : '#fff';
            } else {
              btnBg = 'linear-gradient(90deg,#9333ea 0%,#ec4899 100%)';
              btnColor = '#fff';
            }
          } else if (action === 'contact') {
            btnBg = isDark ? 'rgba(255,255,255,0.06)' : '#F4F1FC';
            btnColor = isDark ? 'rgba(255,255,255,0.75)' : '#5B5473';
            btnBorder = isDark ? '1px solid rgba(255,255,255,0.16)' : '1px solid #E6DDF8';
            btnHoverClass = 'hover:brightness-100';
          } else {
            // downgrade
            btnBg = isDark ? 'rgba(255,255,255,0.07)' : '#f0f0f4';
            btnColor = isDark ? 'rgba(255,255,255,0.6)' : '#616170';
            btnBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #c1c1cd';
          }

          const ctaLabels: Record<typeof action, string> = {
            current: '✓ Current Plan',
            upgrade: `Upgrade to ${plan.name}`,
            downgrade: `Downgrade to ${plan.name}`,
            contact: 'Contact Sales',
          };

          return (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.45 }}
              className="relative rounded-[2rem] flex flex-col overflow-hidden"
              style={{
                border: borderStyle,
                backgroundColor: cardBg,
                boxShadow: isCurrent
                  ? `0 0 0 0px transparent, ${cardShadow}`
                  : cardShadow,
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                  style={{ backgroundColor: '#f5c40022', color: '#ca8a04' }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="p-7 md:p-8 flex flex-col flex-1">
                {/* Name */}
                <h2
                  className="text-[28px] sm:text-[32px] font-extrabold leading-none"
                  style={{ color: titleColor }}
                >
                  {plan.name}
                </h2>

                {/* Price */}
                <div className="mt-3 flex items-end gap-1 leading-none">
                  {plan.price !== 'Custom' ? (
                    <>
                      <span
                        className="mb-1 text-[22px] font-bold"
                        style={{ color: isDark ? '#fff' : '#1a1a27' }}
                      >
                        ₱
                      </span>
                      <span
                        className="text-[50px] font-extrabold tracking-tight"
                        style={{ color: isDark ? '#fff' : '#1a1a27' }}
                      >
                        {plan.price}
                      </span>
                      <span
                        className="mb-1 text-[14px] font-medium"
                        style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#b4aecd' }}
                      >
                        {plan.period}
                      </span>
                    </>
                  ) : (
                    <span
                      className="text-[42px] font-extrabold tracking-tight"
                      style={{ color: isDark ? '#fff' : '#1a1a27' }}
                    >
                      Custom
                    </span>
                  )}
                </div>

                {/* Tagline */}
                <p
                  className="mt-4 text-[14px] leading-[1.35] min-h-[40px]"
                  style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#a6a0c0' }}
                >
                  {plan.tagline}
                </p>

                {/* Features */}
                <ul
                  className="mt-5 space-y-3 text-[14px] flex-1"
                  style={{ color: isDark ? 'rgba(255,255,255,0.85)' : '#303044' }}
                >
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 text-sm font-bold flex-shrink-0"
                        style={{ color: checkColor }}
                        aria-hidden
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handleAction(plan.id)}
                  className={`mt-8 w-full rounded-full px-6 py-3 text-[14px] font-extrabold leading-none transition-all duration-200 ${btnHoverClass} active:scale-[0.97] disabled:cursor-default`}
                  style={{
                    background: btnBg,
                    color: btnColor,
                    border: btnBorder || 'none',
                    boxShadow: btnShadow,
                  }}
                >
                  {ctaLabels[action]}
                </button>
              </div>
            </motion.article>
          );
        })}
      </section>

      {/* ── COMPARISON TABLE ───────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-[2.5rem] border overflow-hidden backdrop-blur-2xl transition-all duration-500"
        style={{
          backgroundColor: isDark ? 'rgba(17, 16, 88, 0.4)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(18, 25, 58, 0.08)',
          boxShadow: isDark 
            ? '0 40px 80px -15px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)' 
            : '0 40px 80px -15px rgba(18,25,58,0.03)',
        }}
      >
        {/* THE SPECTRUM STRIP: Gradient from your screenshot */}
        <div 
          className="absolute top-0 left-0 right-0 h-[4px] z-20" 
          style={{ background: 'linear-gradient(90deg, #7C3AED 0%, #F472B6 50%, #FF9E4A 100%)' }}
        />

        {/* Header: Editorial Style */}
        <div className="px-10 py-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7C3AED]">
                Protocol Selection
              </span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter"
                style={{ color: isDark ? '#FFF' : '#12193A', fontFamily: 'var(--font-montserrat)' }}>
              Compare Plans
            </h3>
          </div>
          
          {currentPlan !== 'free' && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all hover:bg-red-500 hover:text-white"
              style={{
                borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.2)',
                color: isDark ? '#fca5a5' : '#dc2626',
              }}
            >
              Cancel Plan
            </button>
          )}
        </div>

        <div className="overflow-x-auto pb-8">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                <th className="py-10 px-10 text-left w-[30%]">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20">Features</span>
                </th>
                {PLANS.map((plan) => {
                  const isCurrent = currentPlan === plan.id;
                  return (
                    <th key={plan.id} className="py-10 px-6 text-left relative">
                      {/* Visual anchor for chosen plan */}
                      {isCurrent && (
                        <div className="absolute inset-x-2 inset-y-4 bg-[#7C3AED]/[0.04] rounded-3xl z-0" />
                      )}
                      
                      <div className="relative z-10 flex flex-col gap-2">
                        <span className={`text-[15px] font-black uppercase tracking-[0.2em] 
                                        ${isCurrent ? 'bg-clip-text text-transparent' : 'opacity-40'}`}
                              style={{ 
                                backgroundImage: isCurrent ? 'linear-gradient(90deg, #7C3AED 0%, #F472B6 50%, #FF9E4A 100%)' : 'none',
                                color: isCurrent ? 'transparent' : (isDark ? '#FFF' : '#12193A') 
                              }}>
                          {plan.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-[#7C3AED] opacity-60">
                            Currently Active
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="group transition-all hover:bg-white/[0.02]">
                  <td className="py-6 px-10">
                    <span className="text-[13px] font-bold tracking-tight opacity-40 group-hover:opacity-100 transition-all inline-block"
                          style={{ color: isDark ? '#FFF' : '#12193A' }}>
                      {row.label}
                    </span>
                  </td>
                  {row.values.map((val, colIdx) => {
                    const plan = PLANS[colIdx];
                    const isCurrent = plan.id === currentPlan;
                    const isCheck = val === '✓';
                    const isDash = val === '—';

                    return (
                      <td key={plan.id} className="py-6 px-6 relative">
                        <div className="relative z-10">
                          {isCheck ? (
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                              <Check size={12} strokeWidth={4} />
                            </div>
                          ) : isDash ? (
                            <span className="text-xs opacity-10">—</span>
                          ) : (
                            <span className={`text-[13px] font-black tracking-tighter ${isCurrent ? 'text-[#7C3AED]' : 'opacity-70'}`}
                                  style={{ color: isDark ? '#FFF' : '#12193A' }}>
                              {val}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-10 py-6 border-t border-white/5 flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-10" style={{ color: isDark ? '#FFF' : '#12193A' }}>
            Inspire Holdings Inc.
          </span>
          <div className="flex gap-2">
            <div className="w-1 h-1 rounded-full bg-[#7C3AED] opacity-40" />
            <div className="w-1 h-1 rounded-full bg-[#7C3AED] opacity-20" />
            <div className="w-1 h-1 rounded-full bg-[#7C3AED] opacity-10" />
          </div>
        </div>
      </motion.section>

      {/* ── CONFIRM MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmTarget && (() => {
          const target = getPlan(confirmTarget);
          const action = actionFor(confirmTarget, currentPlan);
          const isDowngrade = action === 'downgrade';

          return (
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(15,23,42,0.24)',
                backdropFilter: 'blur(6px)',
              }}
              onClick={() => setConfirmTarget(null)}
            >
              <motion.div
                key="modal-card"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="relative w-full max-w-sm rounded-[2rem] p-7"
                style={{
                  border: `3px solid ${target.accent}`,
                  backgroundColor: isDark ? '#111058' : '#ffffff',
                  boxShadow: isDark
                    ? '0 30px 80px rgba(147,51,234,0.3)'
                    : '8px 10px 40px rgba(20,20,50,0.12)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <p
                  className="text-[11px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: isDowngrade ? '#ca8a04' : target.accent }}
                >
                  {isDowngrade ? 'Confirm Downgrade' : 'Confirm Upgrade'}
                </p>
                <h4
                  className="text-xl font-extrabold mb-1"
                  style={{ color: isDark ? '#fff' : '#120533' }}
                >
                  Switch to {target.name}
                </h4>
                <p
                  className="text-[13px] mb-6 leading-relaxed"
                  style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#a6a0c0' }}
                >
                  {isDowngrade
                    ? `Moving from ${getPlan(currentPlan).name} to ${target.name} will reduce your feature access. This takes effect at the end of your billing cycle.`
                    : `You'll gain access to all ${target.name} features immediately after confirming.`}
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmTarget(null)}
                    className="flex-1 rounded-full px-4 py-3 text-[14px] font-extrabold transition-all hover:brightness-95"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0f0f4',
                      color: isDark ? 'rgba(255,255,255,0.6)' : '#616170',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #c1c1cd',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmAction}
                    className="flex-1 rounded-full px-4 py-3 text-[14px] font-extrabold transition-all hover:brightness-110"
                    style={{
                      background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
                      color: '#fff',
                    }}
                  >
                    {isDowngrade ? `Downgrade to ${target.name}` : `Upgrade to ${target.name}`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}