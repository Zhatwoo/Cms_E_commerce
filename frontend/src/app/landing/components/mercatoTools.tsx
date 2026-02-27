'use client';

function Reveal({ children, className }: { children: React.ReactNode; className?: string; delay?: number; x?: number; y?: number; duration?: number }) {
  return <div className={className}>{children}</div>;
}

const DATA_SOURCES = [
  { name: 'Gluel', desc: 'Open Source', icon: '○' },
  { name: 'Baserow', desc: 'Database API', icon: '◫' },
  { name: 'Strapi', desc: 'Headless CMS', icon: '▣' },
  { name: 'Airtable', desc: 'Connected Ops', icon: '◇' },
];

export function CentricTools({ isDarkMode = false }: { isDarkMode?: boolean }) {
  return (
    <section className={`border-t px-4 pb-24 pt-12 md:px-8 md:pb-28 md:pt-16 ${
      isDarkMode
        ? 'border-[#281b78] bg-[#0a0141] text-white'
        : 'border-[#e5e6ee] bg-[#f2f2f6] text-[#0b0b17]'
    }`}>
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <h2 className="text-[44px] font-black leading-[1.1] tracking-[-0.02em] md:text-[60px]">
            Build Your Website
            <br />
            With Centric Exclusive Tools
          </h2>
          <p className={`mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.35] md:text-[15px] ${isDarkMode ? 'text-white/50' : 'text-[#7a7699]'}`}>
            With Centric&apos;s exclusive tools, you can design, launch, and grow your
            online store faster and smarter than ever before.
          </p>
        </Reveal>

        <Reveal delay={0.1} className={`mt-12 rounded-2xl p-3 md:mt-16 md:p-5 ${
          isDarkMode
            ? 'bg-[#0b0646] shadow-[0_26px_80px_rgba(6,3,37,0.72)]'
            : 'bg-[#f8f8fc] shadow-[0_20px_60px_rgba(28,25,70,0.08)]'
        }`}>
          <div className="grid gap-4 md:grid-cols-[1.05fr_2.2fr_1.05fr]">
            <Reveal delay={0.16} x={-20} className="rounded-2xl bg-[#0d1733] p-4 text-white md:p-5">
              <h3 className="text-lg font-semibold">Data Sources</h3>
              <div className="mt-6 space-y-3">
                {DATA_SOURCES.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-white/5 text-sm text-white/80">
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-white/55">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.2} className="space-y-4">
              <div className="overflow-hidden rounded-2xl bg-[#0d1733]">
                <div className="bg-gradient-to-r from-[#bf4dff] to-[#8b3dff] px-5 py-3 text-sm font-semibold text-white">
                  Custom frontend result
                </div>
                <div className="space-y-4 p-4 md:p-5">
                  <div className="h-6 rounded-md bg-white/7" />
                  <div className="h-5 w-3/5 rounded-md bg-white/10" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-20 rounded-lg bg-white/8" />
                    <div className="h-20 rounded-lg bg-white/8" />
                    <div className="h-20 rounded-lg bg-white/8" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#0d1733] p-4 md:p-5">
                <div className="h-5 w-2/5 rounded-md bg-white/10" />
                <div className="mt-3 h-4 w-1/3 rounded-md bg-white/10" />
                <div className="mt-5 grid grid-cols-4 gap-3">
                  <div className="h-12 rounded-lg bg-white/8" />
                  <div className="h-12 rounded-lg bg-white/8" />
                  <div className="h-12 rounded-lg bg-white/8" />
                  <div className="h-12 rounded-lg bg-white/8" />
                </div>
                <p className="mt-5 text-right text-xs font-semibold text-white/55">
                  HTML Output
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.24} x={20} className="rounded-2xl bg-[#0d1733] p-4 text-white md:p-5">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">Editor Controls</h3>
                <span className="text-white/50">×</span>
              </div>

              <p className="mt-6 text-sm text-white/45">Drag &amp; drop components.</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {['Text', 'Image', 'Button', 'Video'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-left text-sm font-semibold text-white/90"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-8 border-b border-white/15 pb-2">
                <div className="flex items-center gap-5 text-sm font-semibold">
                  <span className="text-[#ffcc00]">Design</span>
                  <span className="text-white/45">Prototype</span>
                </div>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-white/75">
                  <dt>Layout</dt>
                  <dd className="font-semibold text-white">Flex</dd>
                </div>
                <div className="flex items-center justify-between text-white/75">
                  <dt>Fill</dt>
                  <dd className="font-semibold text-[#ffcc00]">#FFCC00</dd>
                </div>
                <div className="flex items-center justify-between text-white/75">
                  <dt>Stroke</dt>
                  <dd className="font-semibold text-white">None</dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

