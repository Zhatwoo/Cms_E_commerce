import { Poppins } from 'next/font/google';
import { CommercePlatform } from './landing/components/commercePlatform';
import { Footer } from './landing/components/footer';
import { Hero } from './landing/components/hero';
import { MercatoTools } from './landing/components/mercatoTools';
import { Pricing } from './landing/components/pricing';
import {
  FrontLayerEntranceSpacer,
  FrontLayerWrapper,
  LandingScrollRoot,
  ScrollGate,
} from './landing/components/scrolling';
import { Testimonials } from './landing/components/testimonials';
import { LandingPageClient } from './landing/landingPageClient';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  return (
    <div className={poppins.className}>
      <LandingPageClient>
        <Hero />
        <div className="relative z-10 -mt-[40vh] rounded-t-3xl bg-[#092727]">
          <ScrollGate>
            <CommercePlatform />
            <MercatoTools />
          </ScrollGate>
        </div>
        <FrontLayerEntranceSpacer />
        <FrontLayerWrapper>
          <Pricing />
          <Testimonials />
          <Footer />
        </FrontLayerWrapper>
      </LandingPageClient>
    </div>
  );
}
