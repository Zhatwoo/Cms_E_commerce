import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Outfit } from 'next/font/google';
import { CommercePlatform } from './landing/components/commercePlatform';
import { Footer } from './landing/components/footer';
import { Hero } from './landing/components/hero';
import { CentricTools } from './landing/components/mercatoTools';
import { Pricing } from './landing/components/pricing';
import { TrialContact } from './landing/components/trialContact';
import { LandingPageClient } from './landing/landingPageClient';

const outfit = Outfit({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
});

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'auth',
  'admindashboard',
  'm_dashboard',
  'design',
  'landing',
  'sites',
  'site',
  's',
  'templates',
]);

function extractSubdomainFromHost(hostname: string): string | null {
  const normalizedHost = (hostname || '').trim().toLowerCase();
  if (!normalizedHost) return null;

  if (normalizedHost.endsWith('.localhost')) {
    const sub = normalizedHost.slice(0, -'.localhost'.length).trim();
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || '').trim().toLowerCase();
  if (baseDomain && normalizedHost.endsWith(`.${baseDomain}`)) {
    const sub = normalizedHost.slice(0, -(baseDomain.length + 1)).trim();
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  const parts = normalizedHost.split('.').filter(Boolean);
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(normalizedHost);
  if (!isIpv4 && parts.length >= 3) {
    const sub = parts[0];
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  return null;
}

export default async function Home() {
  const hdrs = await headers();
  const host = (hdrs.get('x-forwarded-host') || hdrs.get('host') || '').split(':')[0];
  const subdomain = extractSubdomainFromHost(host);
  if (subdomain) {
    redirect(`/sites/${encodeURIComponent(subdomain)}`);
  }

  return (
    <div className={outfit.className}>
      <Suspense fallback={<div className="min-h-screen bg-[#030014]" />}>
      <LandingPageClient>
        <Hero />
        <CommercePlatform />
        <CentricTools />
        <Pricing />
        <TrialContact />
        <Footer />
      </LandingPageClient>
      </Suspense>
    </div>
  );
}
