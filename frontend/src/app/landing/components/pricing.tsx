'use client';

const CARD_FEATURES = [
  'List item',
  'List item',
  'List item',
  'List item',
  'List item',
];

export function Pricing() {
  return (
    <section className="flex-shrink-0 w-full rounded-t-3xl bg-transparent px-6 pt-16 pb-8 md:px-10 md:pt-24 md:pb-12">
      <div className="mx-auto max-w-6xl">
        {/* Main title */}
        <h2 className="mx-auto max-w-3xl text-center text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
          Take advantage in our   1 month free domain
        </h2>

        {/* Pricing cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-gradient-to-b from-white to-black p-[3px]"
            >
              <div
                className="flex flex-col overflow-hidden rounded-[calc(1.5rem-2px)] p-6 md:p-8"
                style={{
                  background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.6) 0%, rgba(15, 23, 42, 0.95) 50%, #000 100%)',
                }}
              >
                <h3 className="text-center text-lg font-semibold text-white md:text-xl">
                  Title
                </h3>
                <div className="mt-4 flex items-baseline justify-center gap-0.5">
                  <span className="text-lg font-medium text-white/90">$</span>
                  <span className="text-4xl font-bold tracking-tight text-white md:text-5xl">50</span>
                  <span className="text-lg font-medium text-white/80">/mo</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {CARD_FEATURES.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-white/90 md:text-base">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-8 w-full rounded-lg bg-white py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/95"
                >
                  Button
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA text */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-white/90 md:mt-10 md:text-lg">
          Get your business online faster! Take advantage of our 1-month free domain offer and start building your website today.
        </p>
      </div>
    </section>
  );
}
