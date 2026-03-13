'use client';

import { motion } from 'framer-motion';

function Reveal({
  children,
  className,
  delay = 0,
  x = 0,
  y = 24,
  duration = 0.72,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  x?: number;
  y?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: false, amount: 0.14 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const DATA_SOURCES = [
  { name: 'Gluel',    desc: 'Open Source',   icon: '○' },
  { name: 'Baserow',  desc: 'Database API',  icon: '◫' },
  { name: 'Strapi',   desc: 'Headless CMS',  icon: '▣' },
  { name: 'Airtable', desc: 'Connected Ops', icon: '◇' },
];

const EDITOR_COMPONENTS = ['Text', 'Image', 'Button', 'Video'];

export function CentricTools({ isDarkMode = false }: { isDarkMode?: boolean }) {

  /* ─── Section / wrapper tokens (respond to isDarkMode) ─── */
  const section = isDarkMode
    ? 'border-[#281b78] bg-[#0a0141] text-white'
    : 'border-[#c1c1cd] bg-white text-[#120533]';

  const outer = isDarkMode
    ? 'bg-[#0b0646] shadow-[0_26px_80px_rgba(6,3,37,0.72)]'
    : 'bg-[#fcfcff] shadow-none';

  /* ─── Section-level text (heading, description) ─── */
  const desc     = isDarkMode ? 'text-white/55'  : 'text-[#616170]';
  const headText = isDarkMode ? 'text-white'      : 'text-[#120533]';

  const eyebrowClass = isDarkMode
    ? 'border-[#3d2fa0]/60 bg-[#1a1572]/40 text-[#a78bfa]'
    : 'border-[#d8d0f7] bg-[#f3f0ff] text-[#7c5cba]';

  const eyebrowDot = isDarkMode ? 'bg-[#a78bfa]' : 'bg-[#8b3dff]';

  /* ─── Frames (toggle based on isDarkMode) ─── */
  const card    = isDarkMode ? 'bg-[#0d1733]' : 'bg-white border border-[#c1c1cd] shadow-[0_2px_12px_rgba(0,0,0,0.06)]';
  const cardTxt = isDarkMode ? 'text-white' : 'text-[#120533]';

  const frameDesc    = isDarkMode ? 'text-white/55' : 'text-[#888899]';
  const frameHead    = isDarkMode ? 'text-white' : 'text-[#120533]';
  const frameRow     = isDarkMode ? 'border-white/10 bg-white/5' : 'border-[#c1c1cd] bg-white';
  const frameIcon    = isDarkMode ? 'bg-white/5 text-white/80' : 'bg-[#e2e2ea] text-[#888899]';
  const framePill    = isDarkMode ? 'bg-[#1b2b68] text-[#95a2d6]' : 'bg-[#e2e2ea] text-[#888899]';
  const frameBtn     = isDarkMode ? 'border-white/10 bg-white/6 text-white/90 hover:bg-white/10 hover:border-white/20' : 'border-[#c1c1cd] bg-[#f8f8fb] text-[#120533] hover:bg-[#e2e2ea]';
  const frameSk      = isDarkMode ? 'bg-white/7' : 'bg-[#e2e2ea]';
  const frameSkMd    = isDarkMode ? 'bg-white/10' : 'bg-[#d1d1dd]';
  const frameHtml    = isDarkMode ? 'border-white/8 bg-white/8 text-[#8da0e4]' : 'border-[#c1c1cd] bg-[#f8f8fb] text-[#888899]';
  const frameCode    = isDarkMode ? 'border-white/8 bg-[#0a0e2a]/50 text-white/35' : 'border-[#c1c1cd] bg-[#f8f8fb] text-[#888899]';
  const frameDivLine = isDarkMode ? 'border-white/15' : 'border-[#c1c1cd]';
  const frameTabAct  = isDarkMode ? 'text-[#ffcc00]' : 'text-[#f5a213]';
  const frameTabBar  = isDarkMode ? 'bg-[#ffcc00]' : 'bg-[#f5a213]';
  const frameHtmlBdg = isDarkMode ? 'border-[#2d3580]/50 bg-[#1b1f6e]/60 text-[#ffcc00]' : 'border-[#c1c1cd] bg-[#f8f8fb] text-[#f5a213]';
  const frameAddSrc  = isDarkMode ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-[#d0d0dc] hover:border-[#888899] hover:bg-[#f8f8fb] text-[#888899]';

  return (
    <section className={`relative overflow-hidden border-t px-4 pb-24 pt-12 md:px-8 md:pb-28 md:pt-16 ${section}`}>

      {/* Ambient glows — dark mode only */}
      {isDarkMode && (
        <>
          <div className="pointer-events-none absolute right-[-6%] top-[8%] h-[400px] w-[400px] rounded-full bg-[#7c3aed]/10 blur-[130px]" />
          <div className="pointer-events-none absolute bottom-[-4%] left-[-6%] h-[340px] w-[340px] rounded-full bg-[#d946ef]/7 blur-[110px]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:56px_56px]" />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-6xl">

        {/* ── Section header ── */}
        <Reveal className="mx-auto max-w-[760px] text-center">
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-[11px] font-bold uppercase tracking-widest ${eyebrowClass}`}>
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${eyebrowDot}`} />
            Exclusive Tools
          </span>

          <h2 className={`mt-5 text-[38px] font-black leading-[1.08] tracking-[-0.025em] sm:text-[48px] md:text-[60px] ${headText}`}>
            Build Your Website
            <br />
            With Centric Exclusive Tools
          </h2>

          <p className={`mx-auto mt-5 max-w-[580px] text-sm leading-relaxed sm:text-[15px] ${desc}`}>
            With Centric&apos;s exclusive tools, you can design, launch, and grow your
            online store faster and smarter than ever before.
          </p>
        </Reveal>

        {/* ── Outer wrapper panel ── */}
        <Reveal delay={0.1} className={`mt-12 rounded-2xl p-3 md:mt-16 md:p-5 ${outer}`}>
          <div className="grid gap-4 md:grid-cols-[1.05fr_2.2fr_1.05fr]">

            {/* ── LEFT: Data Sources (dark frame) ── */}
            <Reveal delay={0.16} x={-20} className={`rounded-2xl p-4 md:p-5 ${card} ${cardTxt}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-semibold sm:text-lg ${frameHead}`}>Data Sources</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${framePill}`}>4 live</span>
              </div>

              <div className="mt-5 space-y-2.5">
                {DATA_SOURCES.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.42, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-150 ${frameRow}`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-sm ${frameIcon}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${frameHead}`}>{item.name}</p>
                      <p className={`truncate text-[11px] ${frameDesc}`}>{item.desc}</p>
                    </div>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#28c840] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#28c840]" />
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 transition-colors ${frameAddSrc}`}
              >
                <span className={`text-base leading-none ${frameDesc}`}>+</span>
                <span className={`text-[11px] font-semibold ${frameDesc}`}>Add source</span>
              </motion.div>
            </Reveal>

            {/* ── CENTRE: Preview (dark frames) ── */}
            <Reveal delay={0.2} className="flex h-full flex-col gap-4">

              {/* Top: custom frontend result */}
              <div className={`overflow-hidden rounded-2xl ${card}`}>
                <div className={`flex items-center justify-between px-5 py-2.5 ${isDarkMode ? 'bg-gradient-to-r from-[#bf4dff] to-[#8b3dff]' : 'bg-[#0bc298]'}`}>
                  <span className="text-xs font-bold tracking-wide text-white">Custom frontend without custom code</span>
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-white/30" />
                    <span className="h-2 w-2 rounded-full bg-white/22" />
                    <span className="h-2 w-2 rounded-full bg-white/15" />
                  </div>
                </div>
                <div className="space-y-3 p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <div className={`h-5 flex-1 rounded-md ${frameSkMd}`} />
                    <div className={`h-5 w-14 rounded-md ${frameSk}`} />
                  </div>
                  <div className={`h-4 w-3/5 rounded-md ${frameSk}`} />
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className={`relative h-16 overflow-hidden rounded-xl sm:h-20 ${frameSk}`}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        transition={{ delay: 0.26 + i * 0.08, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${
                          isDarkMode 
                            ? (i === 0 ? 'from-[#7c3aed]/12' : i === 1 ? 'from-[#d946ef]/10' : 'from-[#ffcc00]/8')
                            : (i === 0 ? 'from-[#fecdd3]/40' : i === 1 ? 'from-[#fef3c7]/40' : 'from-[#e0f2fe]/40')
                        } to-transparent`} />
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#d946ef]"
                        initial={{ width: 0 }}
                        whileInView={{ width: '68%' }}
                        viewport={{ once: false }}
                        transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#a78bfa]">68%</span>
                  </div>
                </div>
              </div>

              {/* Bottom: HTML output */}
              <div className={`flex flex-1 flex-col rounded-2xl p-4 md:p-5 ${card}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className={`h-4 w-2/5 rounded-md ${frameSkMd}`} />
                    <div className={`h-3 w-1/3 rounded-md ${frameSk}`} />
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${frameHtmlBdg}`}>
                    HTML Output
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2.5">
                  {['<h1>', '<p>', '<div>', '<a>'].map((tag, i) => (
                    <motion.div
                      key={tag}
                      className={`flex h-10 items-center justify-center rounded-lg border text-[10px] font-bold sm:h-12 ${frameHtml}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: false }}
                      transition={{ delay: 0.22 + i * 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {tag}
                    </motion.div>
                  ))}
                </div>

                <div className={`mt-4 rounded-xl border p-3 font-mono text-[10px] leading-relaxed sm:text-[11px] ${frameCode}`}>
                  <span className="text-[#d946ef]/80">&lt;section </span>
                  <span className="text-[#ffcc00]/70">class</span>
                  <span className="text-white/35">=</span>
                  <span className="text-[#a78bfa]/90">&quot;hero&quot;</span>
                  <span className="text-[#d946ef]/80">&gt;</span>
                </div>

                <p className={`mt-auto pt-4 text-right text-xs font-semibold ${frameDesc}`}>HTML Output</p>
              </div>
            </Reveal>

            {/* ── RIGHT: Editor Controls (dark frame) ── */}
            <Reveal delay={0.24} x={20} className={`rounded-2xl p-4 md:p-5 ${card} ${cardTxt}`}>
              <div className="flex items-start justify-between">
                <h3 className={`text-base font-semibold sm:text-lg ${frameHead}`}>Editor Controls</h3>
                <motion.span
                  whileHover={{ rotate: 90, scale: 1.2 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                  className={`cursor-default select-none text-xl leading-none ${frameDesc}`}
                >×</motion.span>
              </div>

              <p className={`mt-5 text-sm ${frameDesc}`}>Drag &amp; drop components.</p>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {EDITOR_COMPONENTS.map((item) => (
                  <motion.button
                    key={item}
                    type="button"
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    suppressHydrationWarning
                    className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-all ${frameBtn}`}
                  >
                    <span className="mb-0.5 block text-[10px] opacity-40">
                      {item === 'Text' ? '¶' : item === 'Image' ? '⊞' : item === 'Button' ? '⊡' : '▷'}
                    </span>
                    {item}
                  </motion.button>
                ))}
              </div>

              <div className={`mt-7 border-b pb-2 ${frameDivLine}`}>
                <div className="flex items-center gap-5 text-sm font-semibold">
                  <span className={`relative pb-2 ${frameTabAct}`}>
                    Design
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${frameTabBar}`} />
                  </span>
                  <span className={`pb-2 ${frameDesc}`}>Prototype</span>
                </div>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                {[
                  { dt: 'Fill',   dd: isDarkMode ? '#FFCC00' : '#F5A213', ddCls: isDarkMode ? 'text-[#ffcc00]' : 'text-[#f5a213]' },
                  { dt: 'Contents', dd: '8 layers',    ddCls: frameDesc },
                  { dt: 'Layout', dd: 'Flex',    ddCls: frameHead },
                  { dt: 'Flex', dd: 'Row',    ddCls: frameHead },
                  { dt: 'Grid', dd: 'Cols: 3',    ddCls: frameHead },
                  { dt: 'Rows', dd: 'Infinite',    ddCls: frameDesc },
                ].map(({ dt, dd, ddCls }) => (
                  <div key={dt} className={`flex items-center justify-between ${frameDesc}`}>
                    <dt>{dt}</dt>
                    <dd className={`font-semibold ${ddCls}`}>{dd}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#7c3aed]/25 to-transparent" />
              <p className={`mt-3 text-center text-[10px] ${frameDesc}`}>✦ Live preview enabled</p>
            </Reveal>

          </div>
        </Reveal>
      </div>
    </section>
  );
}