import { Inter } from 'next/font/google';
import { CommercePlatform } from './landing/components/commercePlatform';
import { Hero } from './landing/components/hero';
import { CentricTools } from './landing/components/mercatoTools';
import { Pricing } from './landing/components/pricing';
import { TrialContact } from './landing/components/trialContact';
import { LandingPageClient } from './landing/landingPageClient';

const inter = Inter({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  return (
    <div className={inter.className}>
      <LandingPageClient>
        <Hero />
        <CommercePlatform />
        <CentricTools />
        <Pricing />
        <TrialContact />
      </LandingPageClient>
    </div>
  );
}
