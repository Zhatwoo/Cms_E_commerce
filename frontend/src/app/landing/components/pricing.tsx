'use client';

function Reveal({ children, className }: { children: React.ReactNode; className?: string; delay?: number; x?: number; y?: number; duration?: number }) {
  return <div className={className}>{children}</div>;
}

const PLANS = [
  {
    name: 'Starter',
    price: '0',
    period: '/first month',
    accent: 'violet',
    description: 'Try Centric completely risk-free for 30 days.',
    features: [
      '1 Free Custom Domain',
      'Up to 100 Products',
      'Visual Canvas Editor',
      'Community Support',
    ],
    buttonLabel: 'Select Starter',
  },
  {
    name: 'Standard',
    price: '199',
    period: '/month',
    accent: 'violet',
    description: 'Perfect for starters and small teams.',
    features: ['1 Custom Domain', 'Up to 500 Products', 'Basic Analytics', '24/7 Email Support'],
    buttonLabel: 'Select Standard',
  },
  {
    name: 'Premium',
    price: '499',
    period: '/month',
    accent: 'gold',
    description: 'For growing businesses needing more power.',
    features: [
      'Unlimited Domains',
      'Unlimited Products',
      'Advanced Analytics & Reporting',
      'Priority 24/7 Support',
      'API Access & Webhooks',
    ],
    buttonLabel: 'Select Premium',
  },
] as const;

export function Pricing({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const sectionClass = isDarkMode
    ? 'bg-[#0a0141] text-white'
    : 'bg-[#f2f2f6] text-[#0b0b17]';

  const subtitleClass = isDarkMode ? 'text-white/50' : 'text-[#7a7796]';

  return (
    <section className={`w-full px-4 pb-24 pt-16 md:px-8 md:pb-28 md:pt-20 ${sectionClass}`}>
      <div className="mx-auto max-w-[1120px]">
        <Reveal className="mx-auto max-w-[760px] text-center">
        <h2 className="text-[38px] font-black leading-[1.08] tracking-[-0.02em] md:text-[58px]">
          Take advantage of our
          <br />
          <span className="bg-gradient-to-r from-[#8b3dff] to-[#c026d3] bg-clip-text text-transparent">
            1 month
          </span>{' '}
          free domain
        </h2>
        <p className={`mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.35] md:text-[15px] ${subtitleClass}`}>
          Select the deployment tier that aligns with your business scale and
          infrastructure requirements.
        </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-3 md:gap-7">
          {PLANS.map((plan, index) => {
            const isPremium = plan.accent === 'gold';
            const ringClass = isPremium
              ? isDarkMode
                ? 'border-[3px] border-[#f5c400]'
                : 'border-[3px] border-[#f5c400]'
              : isDarkMode
                ? 'border border-[#3d2a93]'
                : 'border border-[#e8e8ef]';
            const titleClass = isPremium ? 'text-[#f0bb00]' : 'text-[#8b3dff]';
            const buttonClass = isPremium
              ? 'bg-[#f5c400] text-[#1c1d2b] hover:brightness-105'
              : 'bg-gradient-to-r from-[#8b3dff] to-[#c026d3] text-white hover:brightness-110';
            const checkClass = isPremium ? 'text-[#f5c400]' : 'text-[#a855f7]';

            return (
            <Reveal key={plan.name} delay={0.08 + index * 0.08} y={34}>
            <div className={`h-full rounded-[2rem] p-7 md:min-h-[500px] md:p-8 ${ringClass} ${
              isDarkMode
                ? 'bg-[#111058] shadow-[8px_10px_20px_rgba(5,3,39,0.55)]'
                : 'bg-white shadow-[8px_10px_12px_rgba(23,24,40,0.2)]'
            }`}>
              <div className="flex h-full flex-col">
                <h3 className={`text-[35px] font-extrabold leading-none ${titleClass}`}>{plan.name}</h3>

                <div className="mt-3 flex items-end gap-2 leading-none">
                  <span className={`mb-1 text-[30px] font-bold ${isDarkMode ? 'text-white' : 'text-[#1a1a27]'}`}>₱</span>
                  <span className={`text-[58px] font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1a1a27]'}`}>{plan.price}</span>
                  <span className={`mb-1 text-[16px] font-medium ${isDarkMode ? 'text-white/55' : 'text-[#b4aecd]'}`}>{plan.period}</span>
                </div>

                <p className={`mt-4 min-h-[56px] text-[15px] leading-[1.25] ${isDarkMode ? 'text-white/60' : 'text-[#a6a0c0]'}`}>
                  {plan.description}
                </p>

                <ul className={`mt-5 space-y-3 text-[15px] ${isDarkMode ? 'text-white/88' : 'text-[#303044]'}`}>
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className={`mt-0.5 text-sm font-bold ${checkClass}`} aria-hidden>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`mt-auto whitespace-nowrap rounded-full px-7 py-3 text-[16px] font-extrabold leading-none transition ${buttonClass}`}
                  suppressHydrationWarning
                >
                  {plan.buttonLabel}
                </button>
              </div>
            </div>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
