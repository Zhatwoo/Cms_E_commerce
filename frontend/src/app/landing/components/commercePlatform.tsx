'use client';

function Reveal({ children, className }: { children: React.ReactNode; className?: string; delay?: number; x?: number; y?: number; duration?: number }) {
  return <div className={className}>{children}</div>;
}

export function CommercePlatform({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const sectionClass = isDarkMode
    ? 'bg-[#0a0141] text-white'
    : 'bg-[#f2f2f6] text-[#0b0b17]';

  const descriptionClass = isDarkMode ? 'text-white/55' : 'text-[#7a7699]';

  const cardBaseClass = isDarkMode
    ? 'border border-[#2f2579] bg-[#111058] shadow-[0_14px_40px_rgba(5,2,38,0.52)]'
    : 'border border-[#ececf2] bg-white shadow-[0_10px_30px_rgba(22,17,75,0.06)]';

  return (
    <section className={`px-4 pb-24 pt-16 md:px-8 md:pb-28 md:pt-24 ${sectionClass} ${isDarkMode ? '-mt-px' : ''}`}>
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <h2 className="text-[44px] font-black leading-[1.1] tracking-[-0.02em] md:text-[60px]">
            The commerce platform
            <br />
            behind everything we build
          </h2>
          <p className={`mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.35] md:text-[15px] ${descriptionClass}`}>
            Build, customize, and scale e-commerce websites with total control.
            <br />
            A flexible, modern system for building powerful online stores.
            <br />
            Everything you need to create, manage, and grow your store.
          </p>
        </Reveal>

        <div className={`mt-14 rounded-none p-4 md:mt-16 md:p-8 ${isDarkMode ? 'bg-[#0a0141]' : 'bg-[#f2f2f6]'}`}>
          <div className="grid items-center gap-5 md:grid-cols-3 md:gap-6">
            <Reveal delay={0.08} x={-22}>
            <article className={`rounded-2xl p-5 md:mt-12 ${cardBaseClass}`}>
              <div className="mb-4 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-white/35' : 'bg-[#ff6b6b]'}`} />
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-white/30' : 'bg-[#ffd166]'}`} />
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-white/25' : 'bg-[#6bcb77]'}`} />
              </div>
              <p className={`text-xl font-bold leading-snug md:text-2xl ${isDarkMode ? 'text-white' : 'text-[#262547]'}`}>
                Generate stock photos with various genders for creative testing
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['People', 'Clothing', 'Business', 'Technology'].map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      isDarkMode ? 'bg-[#1b2b68] text-[#95a2d6]' : 'bg-[#eef0f7] text-[#7f7ca1]'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex justify-end gap-2">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-8 w-8 rounded-full ${isDarkMode ? 'bg-[#16306e]' : 'bg-[#eceef6]'}`}
                    aria-hidden
                  />
                ))}
              </div>
            </article>
            </Reveal>

            <Reveal delay={0.14}>
            <article className={`rounded-2xl border-2 p-5 ${
              isDarkMode
                ? 'border-[#5c35b6] bg-[#111058] shadow-[0_14px_40px_rgba(5,2,38,0.52)]'
                : 'border-[#d9b8ff] bg-white shadow-[0_10px_30px_rgba(22,17,75,0.06)]'
            }`}>
              <div className="mb-4 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-white/35' : 'bg-[#ff6b6b]'}`} />
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-white/30' : 'bg-[#ffd166]'}`} />
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-white/25' : 'bg-[#6bcb77]'}`} />
              </div>
              <p className={`text-xl font-bold leading-snug md:text-2xl ${isDarkMode ? 'text-white' : 'text-[#262547]'}`}>
                What will you <span className="text-[#8b3dff]">design</span> today?
              </p>
              <p className={`mt-2 text-base md:text-lg ${isDarkMode ? 'text-white/65' : 'text-[#8080a0]'}`}>
                Design, generate, print, and work on anything.
              </p>
              <button
                className={`mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  isDarkMode ? 'bg-[#9d3fff]' : 'bg-[#8b3dff]'
                }`}
                type="button"
              >
                Start designing
              </button>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <span className={`rounded-lg px-2 py-3 text-xs font-semibold ${isDarkMode ? 'bg-[#172354] text-[#8da0e4]' : 'bg-[#e8f5ea] text-[#74858d]'}`}>Research Doc</span>
                <span className={`rounded-lg px-2 py-3 text-xs font-semibold ${isDarkMode ? 'bg-[#2b2451] text-[#b3a2df]' : 'bg-[#f8f2e4] text-[#9c8f74]'}`}>Presentation</span>
                <span className={`rounded-lg px-2 py-3 text-xs font-semibold ${isDarkMode ? 'bg-[#1c2a60] text-[#8ba3dc]' : 'bg-[#e7eefb] text-[#6f86ad]'}`}>Websites</span>
              </div>
            </article>
            </Reveal>

            <Reveal delay={0.2} x={22}>
            <article className={`rounded-2xl p-5 md:-mt-8 ${cardBaseClass}`}>
              <div className="mb-4 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-white/35' : 'bg-[#ff6b6b]'}`} />
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-white/30' : 'bg-[#ffd166]'}`} />
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-white/25' : 'bg-[#6bcb77]'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg ${isDarkMode ? 'bg-[#162568]' : 'bg-[#eff1f7]'}`}
                    aria-hidden
                  />
                ))}
              </div>
              <p className={`mt-4 text-center text-xs ${isDarkMode ? 'text-white/45' : 'text-[#9ea1bc]'}`}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </article>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
