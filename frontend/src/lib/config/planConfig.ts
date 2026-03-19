export const PLAN_OPTIONS = ['free', 'basic', 'pro'] as const;

export type PlanType = (typeof PLAN_OPTIONS)[number];

export function normalizePlan(plan: string | null | undefined): PlanType {
  const normalized = (plan || 'free').toLowerCase();
  if (normalized === 'basic' || normalized === 'pro') return normalized;
  return 'free';
}

export function getPlanLabel(plan: string | null | undefined): string {
  const normalized = normalizePlan(plan);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getPlanPillClasses(plan: string | null | undefined): string {
  const normalized = normalizePlan(plan);
  if (normalized === 'basic') return 'bg-[#FFCC00] text-[#2A1A47]';
  if (normalized === 'pro') return 'bg-[#0A8F2F] text-white';
  return 'bg-[#3D49DD] text-white';
}

export function getPlanDotClass(plan: string | null | undefined): string {
  const normalized = normalizePlan(plan);
  if (normalized === 'basic') return 'bg-[#8A78FF]';
  if (normalized === 'pro') return 'bg-[#FFCC00]';
  return 'bg-[#BFAAFF]';
}

export function getPlanSolidColor(plan: string | null | undefined): string {
  const normalized = normalizePlan(plan);
  if (normalized === 'basic') return '#8A78FF';
  if (normalized === 'pro') return '#FFCC00';
  return '#BFAAFF';
}
