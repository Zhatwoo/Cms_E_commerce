import { Suspense } from 'react';
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

export default function Home() {
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
