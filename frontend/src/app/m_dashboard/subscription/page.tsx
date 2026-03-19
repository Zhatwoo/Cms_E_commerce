'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';
import { getStoredUser } from '@/lib/api';
import { SUBSCRIPTION_LIMITS, type SubscriptionPlan } from '@/lib/subscriptionLimits';

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
      className="relative mx-auto w-full px-4 sm:px-6 pb-16"
      style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
    >
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="mb-10 text-center pt-4">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[36px] sm:text-[48px] font-black leading-[1.08] tracking-[-0.02em]"
          style={{ color: isDark ? '#fff' : '#120533' }}
        >
          Choose Your{' '}
          <span
            className="bg-gradient-to-r from-[#8b3dff] to-[#c026d3] bg-clip-text text-transparent"
          >
            Scale
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="mx-auto mt-3 max-w-xl text-[15px]"
          style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#616170' }}
        >
          Start free, upgrade as you grow — no lock-ins, no surprises.
        </motion.p>

        {/* Current plan pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-5 inline-flex items-center gap-2.5 rounded-full border px-5 py-2 text-xs font-semibold"
          style={{
            borderColor: `${currentPlanData.accent}55`,
            backgroundColor: isDark ? `${currentPlanData.glow}` : `${currentPlanData.accent}12`,
            color: currentPlanData.accent,
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ backgroundColor: currentPlanData.accent }} />
            <span className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: currentPlanData.accent }} />
          </span>
          Active: {currentPlanData.name} Plan
          {currentPlan !== 'free' && (
            <button
              type="button"
              onClick={handleCancel}
              className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-opacity hover:opacity-70"
              style={{ backgroundColor: '#ef444422', color: '#f87171' }}
            >
              Cancel
            </button>
          )}
        </motion.div>
      </section>

      {/* ── PLAN CARDS ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {PLANS.map((plan, idx) => {
          const action = actionFor(plan.id, currentPlan);
          const isCurrent = action === 'current';
          const isPremium = plan.isPremium;

          // Border: match landing page style
          const borderStyle = isCurrent
            ? `3px solid ${plan.accent}`
            : isPremium
              ? isDark ? '3px solid #f5c400' : '3px solid #d946ef'
              : isDark ? '1px solid #3d2a93' : '1px solid #c1c1cd';

          // Background: white in light, dark card in dark
          const cardBg = isDark ? '#111058' : '#ffffff';
          const cardShadow = isDark
            ? '8px 10px 20px rgba(5,3,39,0.55)'
            : '8px 10px 12px rgba(20,20,50,0.06)';

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

          if (isCurrent) {
            btnBg = isDark ? 'rgba(147,51,234,0.15)' : '#f0f0f4';
            btnColor = isDark ? '#a78bfa' : '#120533';
            btnBorder = isDark ? '1px solid rgba(147,51,234,0.3)' : '1px solid #c1c1cd';
          } else if (action === 'upgrade' || action === 'contact') {
            if (isPremium) {
              btnBg = isDark ? '#f5c400' : 'linear-gradient(90deg,#9333ea 0%,#ec4899 100%)';
              btnColor = isDark ? '#1c1d2b' : '#fff';
            } else {
              btnBg = 'linear-gradient(90deg,#9333ea 0%,#ec4899 100%)';
              btnColor = '#fff';
            }
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
                  className="mt-8 w-full rounded-full px-6 py-3 text-[14px] font-extrabold leading-none transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:cursor-default"
                  style={{
                    background: btnBg,
                    color: btnColor,
                    border: btnBorder || 'none',
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="rounded-[2rem] border overflow-hidden"
        style={{
          borderColor: isDark ? '#3d2a93' : '#e2e2ea',
          backgroundColor: isDark ? '#111058' : '#ffffff',
          boxShadow: isDark ? '8px 10px 20px rgba(5,3,39,0.55)' : '8px 10px 12px rgba(20,20,50,0.06)',
        }}
      >
        <div className="px-6 sm:px-8 pt-6 pb-2 flex items-center justify-between">
          <h3
            className="text-base font-bold"
            style={{ color: isDark ? '#fff' : '#120533' }}
          >
            Feature Comparison
          </h3>
          <span
            className="text-[11px]"
            style={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#a6a0c0' }}
          >
            All prices monthly
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${isDark ? '#3d2a93' : '#e2e2ea'}` }}>
                <th
                  className="py-3 px-6 sm:px-8 text-left font-medium w-[28%]"
                  style={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#a6a0c0' }}
                >
                  Feature
                </th>
                {PLANS.map((plan) => (
                  <th
                    key={plan.id}
                    className="py-3 px-3 text-left font-bold w-[18%]"
                    style={{
                      color: currentPlan === plan.id
                        ? plan.accent
                        : isDark ? 'rgba(255,255,255,0.75)' : '#303044',
                    }}
                  >
                    {plan.name}
                    {currentPlan === plan.id && (
                      <span
                        className="ml-1.5 inline-block rounded-full w-1.5 h-1.5 align-middle"
                        style={{ backgroundColor: plan.accent }}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, rowIdx) => (
                <tr
                  key={row.label}
                  style={{
                    borderBottom: rowIdx < COMPARISON_ROWS.length - 1
                      ? `1px solid ${isDark ? '#3d2a93' : '#e2e2ea'}`
                      : undefined,
                  }}
                >
                  <td
                    className="py-3 px-6 sm:px-8"
                    style={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#616170' }}
                  >
                    {row.label}
                  </td>
                  {row.values.map((val, colIdx) => {
                    const plan = PLANS[colIdx];
                    const isCurrent = plan.id === currentPlan;
                    const isPositive = val !== '—';
                    return (
                      <td
                        key={plan.id}
                        className="py-3 px-3 font-semibold"
                        style={{
                          color: !isPositive
                            ? isDark ? 'rgba(255,255,255,0.25)' : '#c1c1cd'
                            : isCurrent
                              ? plan.accent
                              : val === 'Unlimited' || val === '✓'
                                ? isDark ? '#86EFAC' : '#16a34a'
                                : isDark ? 'rgba(255,255,255,0.85)' : '#303044',
                          opacity: !isPositive ? 0.6 : 1,
                        }}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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