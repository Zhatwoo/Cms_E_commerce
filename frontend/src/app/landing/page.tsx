import { CommercePlatform } from './components/commercePlatform';
import { Footer } from './components/footer';
import { Hero } from './components/hero';
import { LandingHeader } from './components/header';
import { MercatoTools } from './components/mercatoTools';
import { Pricing } from './components/pricing';
import {
  FrontLayerEntranceSpacer,
  FrontLayerWrapper,
  LandingScrollRoot,
  ScrollGate,
} from './components/scrolling';
import { Testimonials } from './components/testimonials';

export default function LandingPage() {
  return (
    <LandingScrollRoot headerSlot={<LandingHeader />}>
      <Hero />
      {/* Back layer: gate scrolls CommercePlatform + MercatoTools then handoff; rounded top so edge is curved */}
      <div className="relative z-10 -mt-[40vh] rounded-t-3xl bg-[#092727]">
        <ScrollGate>
          <CommercePlatform />
          <MercatoTools />
        </ScrollGate>
      </div>
      {/* Spacer: scroll dito drives Pricing slide-up entrance (420px) */}
      <FrontLayerEntranceSpacer />
      {/* Front layer: fixed overlay, tumataas at nag-o-overlap entirely sa MercatoTools */}
      <FrontLayerWrapper>
        <Pricing />
        <Testimonials />
        <Footer />
      </FrontLayerWrapper>
    </LandingScrollRoot>
  );
}
