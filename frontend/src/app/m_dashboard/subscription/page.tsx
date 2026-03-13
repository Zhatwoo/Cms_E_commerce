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
  priceNote?: string;
  tagline: string;
  features: string[];
  limitSummary: string;
  accent: string;
  glow: string;
  badge?: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLAN_ORDER: PlanId[] = ['free', 'basic', 'pro', 'custom'];

const PLANS: PlanItem[] = [
  {
    id: 'free',
    name: 'Starter',
    price: '₱0',
    tagline: 'Risk-free first month',
    features: ['1 custom domain', 'Up to 100 products', 'Visual canvas editor', 'Community support'],
    limitSummary: `${SUBSCRIPTION_LIMITS.free.projects} projects · ${SUBSCRIPTION_LIMITS.free.domains} domain`,
    accent: '#4F7CFF',
    glow: 'rgba(79,124,255,0.18)',
  },
  {
    id: 'basic',
    name: 'Standard',
    price: '₱199',
    priceNote: '/mo',
    tagline: 'Small teams & starters',
    badge: 'Popular',
    features: ['1 custom domain', 'Up to 500 products', 'Basic analytics', '24/7 email support'],
    limitSummary: `${SUBSCRIPTION_LIMITS.basic.projects} projects · ${SUBSCRIPTION_LIMITS.basic.domains} domain`,
    accent: '#A64CD9',
    glow: 'rgba(166,76,217,0.2)',
  },
  {
    id: 'pro',
    name: 'Premium',
    price: '₱499',
    priceNote: '/mo',
    tagline: 'Growing businesses',
    features: ['Unlimited domains', 'Unlimited products', 'Advanced analytics', 'Priority 24/7 support', 'API & webhooks'],
    limitSummary: 'Unlimited projects · Unlimited domains',
    accent: '#FFCE00',
    glow: 'rgba(255,206,0,0.18)',
  },
  {
    id: 'custom',
    name: 'Enterprise',
    price: 'Custom',
    tagline: 'Advanced teams & orgs',
    features: ['Custom limits', 'Dedicated manager', 'SLA guarantee', 'Custom integrations', 'White-label'],
    limitSummary: 'Tailored to your scale',
    accent: '#22D3EE',
    glow: 'rgba(34,211,238,0.18)',
  },
];

const COMPARISON_ROWS = [
  { label: 'Projects', values: [String(SUBSCRIPTION_LIMITS.free.projects), String(SUBSCRIPTION_LIMITS.basic.projects), 'Unlimited', 'Custom'] },
  { label: 'Domains', values: [String(SUBSCRIPTION_LIMITS.free.domains), String(SUBSCRIPTION_LIMITS.basic.domains), 'Unlimited', 'Custom'] },
  { label: 'Products', values: ['100', '500', 'Unlimited', 'Custom'] },
  { label: 'Analytics', values: ['—', 'Basic', 'Advanced', 'Advanced'] },
  { label: 'Code Editor', values: ['—', '—', '✓', '✓'] },
  { label: 'Support', values: ['Community', 'Email', 'Priority', 'Dedicated'] },
  { label: 'API Access', values: ['—', '—', '✓', '✓'] },
  { label: 'White-label', values: ['—', '—', '—', '✓'] },
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3 flex-shrink-0 mt-0.5" fill="none">
      <circle cx="6" cy="6" r="5.5" stroke={color} strokeOpacity="0.3" />
      <path d="M3.5 6l1.8 1.8 3-3.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { colors, theme } = useTheme();
  const { showAlert } = useAlert();

  const user = getStoredUser();
  const currentPlan = toPlanId((user?.subscriptionPlan || 'free').toLowerCase() as SubscriptionPlan);
  const currentPlanData = getPlan(currentPlan);

  const [confirmTarget, setConfirmTarget] = React.useState<PlanId | null>(null);

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
      className="dashboard-landing-light relative mx-auto w-full max-w-[1240px] 2xl:max-w-[1320px] px-1 sm:px-2 pb-12"
      style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[60px] h-[360px] w-[360px] rounded-full opacity-[0.18] blur-[80px]"
          style={{ backgroundColor: colors.accent.purpleDeep }} />
        <div className="absolute right-[8%] top-[100px] h-[280px] w-[280px] rounded-full opacity-[0.15] blur-[80px]"
          style={{ backgroundColor: colors.accent.yellow }} />
      </div>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="mb-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[42px] sm:text-[58px] lg:text-[76px] font-extrabold leading-[0.95] tracking-tight"
        >
          <span className="block" style={{ color: colors.text.primary }}>Choose Your</span>
          <span
            className="block text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(90deg, #B13BFF 0%, #B36760 50%, #FFCC00 100%)' }}
          >
            Scale
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="mx-auto mt-3 max-w-xl text-sm sm:text-base"
          style={{ color: colors.text.secondary }}
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
            backgroundColor: `${currentPlanData.glow}`,
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
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {PLANS.map((plan, idx) => {
          const action = actionFor(plan.id, currentPlan);
          const isCurrent = action === 'current';
          const isHighlighted = plan.id === 'basic';

          const ctaStyles: Record<typeof action, React.CSSProperties> = {
            current: { backgroundColor: `${plan.accent}20`, color: plan.accent, border: `1px solid ${plan.accent}55`, cursor: 'default' },
            upgrade: { background: `linear-gradient(135deg, ${plan.accent}CC, ${plan.accent})`, color: '#000', border: 'none' },
            downgrade: { backgroundColor: 'transparent', color: colors.text.muted, border: `1px solid ${colors.border.faint}` },
            contact: { background: `linear-gradient(135deg, #22D3EEaa, #22D3EE)`, color: '#000', border: 'none' },
          };

          const ctaLabels: Record<typeof action, string> = {
            current: '✓ Current Plan',
            upgrade: `Upgrade to ${plan.name}`,
            downgrade: `Downgrade to ${plan.name}`,
            contact: 'Contact Sales',
          };

          return (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.45 }}
              className="relative overflow-hidden rounded-[26px] border flex flex-col"
              style={{
                borderColor: isCurrent ? `${plan.accent}66` : isHighlighted ? `${colors.accent.yellow}44` : colors.border.faint,
                background: theme === 'dark'
                  ? `linear-gradient(160deg, ${colors.bg.card} 0%, rgba(10, 3, 50, 0.9) 100%)`
                  : `linear-gradient(160deg, ${colors.bg.card} 0%, ${colors.bg.searchBar} 100%)`,
                boxShadow: isCurrent
                  ? `0 0 0 2px ${plan.accent}44, 0 20px 48px ${plan.glow}`
                  : theme === 'dark'
                    ? `0 12px 36px rgba(6,3,30,0.5)`
                    : `0 10px 30px rgba(21,9,62,0.10)`,
              }}
            >
              {/* Accent glow blob */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl opacity-40"
                style={{ backgroundColor: plan.accent }} />

              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                  style={{ backgroundColor: `${colors.accent.yellow}22`, color: colors.accent.yellow }}>
                  {plan.badge}
                </div>
              )}

              <div className="p-5 flex flex-col flex-1">
                {/* Name + tagline */}
                <div className="mb-4">
                  <h2 className="text-xl font-extrabold" style={{ color: colors.text.primary }}>{plan.name}</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: colors.text.muted }}>{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-4 flex items-end gap-1">
                  <span className="text-[36px] font-extrabold leading-none" style={{ color: colors.text.primary }}>
                    {plan.price}
                  </span>
                  {plan.priceNote && (
                    <span className="mb-1 text-xs" style={{ color: colors.text.muted }}>{plan.priceNote}</span>
                  )}
                </div>

                {/* Limit summary */}
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: plan.accent }}>
                  {plan.limitSummary}
                </p>

                {/* Features */}
                <ul className="mb-6 space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs" style={{ color: colors.text.secondary }}>
                      <CheckIcon color={plan.accent} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handleAction(plan.id)}
                  className="w-full rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                  style={ctaStyles[action]}
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
        className="rounded-[26px] border overflow-hidden"
        style={{
          borderColor: colors.border.faint,
          background: theme === 'dark'
            ? `linear-gradient(180deg, ${colors.bg.card} 0%, rgba(8,2,40,0.9) 100%)`
            : `linear-gradient(180deg, ${colors.bg.card} 0%, ${colors.bg.searchBar} 100%)`,
        }}
      >
        <div className="px-5 sm:px-6 pt-5 pb-2 flex items-center justify-between">
          <h3 className="text-base font-bold" style={{ color: colors.text.primary }}>Feature Comparison</h3>
          <span className="text-[11px]" style={{ color: colors.text.muted }}>All prices monthly</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border.faint}` }}>
                <th className="py-3 px-5 sm:px-6 text-left font-medium w-[28%]" style={{ color: colors.text.muted }}>Feature</th>
                {PLANS.map((plan) => (
                  <th key={plan.id} className="py-3 px-3 text-left font-bold w-[18%]"
                    style={{ color: currentPlan === plan.id ? plan.accent : colors.text.secondary }}>
                    {plan.name}
                    {currentPlan === plan.id && (
                      <span className="ml-1.5 inline-block rounded-full w-1.5 h-1.5 align-middle"
                        style={{ backgroundColor: plan.accent }} />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, rowIdx) => (
                <tr key={row.label}
                  style={{ borderBottom: rowIdx < COMPARISON_ROWS.length - 1 ? `1px solid ${colors.border.faint}` : undefined }}>
                  <td className="py-3 px-5 sm:px-6" style={{ color: colors.text.secondary }}>{row.label}</td>
                  {row.values.map((val, colIdx) => {
                    const plan = PLANS[colIdx];
                    const isCurrent = plan.id === currentPlan;
                    const isPositive = val !== '—';
                    return (
                      <td key={plan.id} className="py-3 px-3 font-medium"
                        style={{
                          color: !isPositive ? colors.text.muted : isCurrent ? plan.accent : val === 'Unlimited' || val === '✓' ? '#86EFAC' : colors.text.primary,
                          opacity: !isPositive ? 0.45 : 1,
                        }}>
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
              style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.72)' : 'rgba(15,23,42,0.24)', backdropFilter: 'blur(6px)' }}
              onClick={() => setConfirmTarget(null)}
            >
              <motion.div
                key="modal-card"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="relative w-full max-w-sm rounded-[24px] border p-6"
                style={{
                  borderColor: `${target.accent}55`,
                  backgroundColor: colors.bg.card,
                  boxShadow: `0 30px 80px ${target.glow}`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-50"
                  style={{ backgroundColor: target.accent }} />

                <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: isDowngrade ? '#fbbf24' : target.accent }}>
                  {isDowngrade ? 'Confirm Downgrade' : 'Confirm Upgrade'}
                </p>
                <h4 className="text-xl font-extrabold mb-1" style={{ color: colors.text.primary }}>
                  Switch to {target.name}
                </h4>
                <p className="text-xs mb-5" style={{ color: colors.text.muted }}>
                  {isDowngrade
                    ? `Moving from ${getPlan(currentPlan).name} to ${target.name} will reduce your feature access. This takes effect at the end of your billing cycle.`
                    : `You'll gain access to all ${target.name} features immediately after confirming.`}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmTarget(null)}
                    className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold"
                    style={{ backgroundColor: colors.bg.elevated, color: colors.text.muted, border: `1px solid ${colors.border.faint}` }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmAction}
                    className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold transition-opacity hover:opacity-85"
                    style={{
                      background: isDowngrade
                        ? 'linear-gradient(135deg, #CA8A04, #EAB308)'
                        : `linear-gradient(135deg, ${target.accent}cc, ${target.accent})`,
                      color: '#000',
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