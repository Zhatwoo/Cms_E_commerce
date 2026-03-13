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
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── CSS 3D Holographic Globe (matches reference design) ── */
function Globe({ isDarkMode = false }: { isDarkMode?: boolean }) {
  // 4 meridian rings at 0 / 45 / 90 / 135 deg + 1 equator ring
  const meridians = [
    { cls: 'rotateY(0deg)',   color: isDarkMode ? 'rgba(177,59,255,0.35)' : 'rgba(147, 51, 234, 0.4)' },
    { cls: 'rotateY(45deg)',  color: isDarkMode ? 'rgba(177,59,255,0.28)' : 'rgba(147, 51, 234, 0.3)' },
    { cls: 'rotateY(90deg)',  color: isDarkMode ? 'rgba(177,59,255,0.28)' : 'rgba(147, 51, 234, 0.3)' },
    { cls: 'rotateY(135deg)', color: isDarkMode ? 'rgba(177,59,255,0.22)' : 'rgba(147, 51, 234, 0.2)' },
    { cls: 'rotateX(90deg)',  color: isDarkMode ? 'rgba(255,204,0,0.22)'  : 'rgba(245, 162, 19, 0.3)' }, // equator — gold/orange tint
  ];

  return (
    <div
      className="relative flex h-[clamp(340px,42vw,540px)] w-full items-center justify-center"
      aria-hidden
    >
      {/* keyframe styles injected inline */}
      <style>{`
        @keyframes spinGlobe { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
      `}</style>

      {/* Perspective wrapper */}
      <div
        className="relative"
        style={{
          width:       'clamp(280px,34vw,440px)',
          height:      'clamp(280px,34vw,440px)',
          perspective: '1200px',
        }}
      >
        {/* Outer ambient glow — sits behind the globe */}
        <div
          className="pointer-events-none absolute inset-[-15%] rounded-full"
          style={{
            background: isDarkMode ? 'radial-gradient(circle, rgba(177,59,255,0.18) 0%, transparent 68%)' : 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 68%)',
            filter:     'blur(24px)',
          }}
        />

        {/* The spinning globe shell */}
        <div
          className="relative h-full w-full rounded-full"
          style={{
            transformStyle: 'preserve-3d',
            animation:      'spinGlobe 40s linear infinite',
          }}
        >
          {/* Meridian & equator rings */}
          {meridians.map((m, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                border:    `1px solid ${m.color}`,
                boxShadow: `inset 0 0 30px ${m.color.replace(')', ', 0.08)').replace('rgba', 'rgba')}`,
                transform: m.cls,
              }}
            />
          ))}

          {/* Core inner glow */}
          <div
            className="absolute rounded-full"
            style={{
              top:        '20%',
              left:       '20%',
              width:      '60%',
              height:     '60%',
              background: isDarkMode ? 'radial-gradient(circle, rgba(177,59,255,0.22) 0%, transparent 65%)' : 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 65%)',
              filter:     'blur(18px)',
            }}
          />
        </div>

        {/* Outer border glow ring (static, not spinning) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            border:    isDarkMode ? '1px solid rgba(177,59,255,0.4)' : '1px solid rgba(147, 51, 234, 0.3)',
            boxShadow: isDarkMode ? '0 0 40px rgba(177,59,255,0.15), inset 0 0 40px rgba(177,59,255,0.08)' : '0 0 40px rgba(147, 51, 234, 0.1), inset 0 0 40px rgba(147, 51, 234, 0.05)',
          }}
        />
      </div>

    </div>
  );
}

export function TrialContact({ isDarkMode = false }: { isDarkMode?: boolean }) {
  return (
    <section className={`-mt-[10px] w-full ${isDarkMode ? 'bg-[#120456] text-white' : 'bg-white text-[#120533]'}`}>

      {/* Top gold rule */}
      <div className={`h-[2px] w-full bg-gradient-to-r from-transparent ${isDarkMode ? 'via-[#f4bf1a]' : 'via-[#9333ea]/30'} to-transparent`} />

      <div className="relative overflow-hidden px-4 pb-24 pt-14 sm:px-6 md:px-10 md:pb-28 md:pt-20 lg:px-16 xl:px-20">

        {/* Ambient glows */}
        <div className={`pointer-events-none absolute left-1/2 top-0 h-[clamp(400px,50vw,700px)] w-[clamp(400px,60vw,800px)] -translate-x-1/2 rounded-full blur-[2px] ${isDarkMode ? 'bg-[radial-gradient(circle,rgba(177,59,255,0.15)_0%,transparent_72%)]' : 'bg-[radial-gradient(circle,rgba(217,70,239,0.08)_0%,transparent_72%)]'}`} />
        <div className={`pointer-events-none absolute bottom-0 right-[-10%] h-[clamp(300px,35vw,500px)] w-[clamp(300px,35vw,500px)] rounded-full blur-[120px] ${isDarkMode ? 'bg-[#7c3aed]/8' : 'bg-[#d946ef]/5'}`} />
        <div className={`pointer-events-none absolute inset-0 bg-[size:56px_56px] ${isDarkMode ? 'bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]'}`} />

        <div className="relative z-10 mx-auto max-w-[1200px]">

          {/* ── Trial CTA ── */}
          <Reveal className="mx-auto max-w-[820px] text-center">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-[11px] font-bold uppercase tracking-widest ${
              isDarkMode ? 'border-[#f4bf1a]/30 bg-[#f4bf1a]/10 text-[#f4bf1a]' : 'border-[#9333ea]/30 bg-[#9333ea]/10 text-[#9333ea]'
            }`}>
              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${isDarkMode ? 'bg-[#f4bf1a]' : 'bg-[#9333ea]'}`} />
              30-Day Free Trial
            </span>

            <h2 className="mt-5 text-[clamp(1.9rem,4.5vw,3.5rem)] font-black leading-[1.06] tracking-[-0.025em]">
              Start your 30-day free trial
            </h2>

            <p className={`mx-auto mt-4 max-w-[580px] text-[clamp(0.8rem,1.2vw,0.9375rem)] leading-relaxed ${isDarkMode ? 'text-white/55' : 'text-[#616170]'}`}>
              Join over 4,000+ startups already scaling their architecture with Centric.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                suppressHydrationWarning
                className={`rounded-full border px-[clamp(1.5rem,3vw,2.5rem)] py-[clamp(0.55rem,1vw,0.75rem)] text-[clamp(0.75rem,1vw,0.875rem)] font-bold transition ${isDarkMode ? 'border-white/22 text-white hover:bg-white/10' : 'border-black/10 text-[#120533] hover:bg-black/5 shadow-sm'}`}
              >
                Learn more
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: isDarkMode ? '0 6px 28px rgba(245,196,0,0.55)' : '0 12px 28px rgba(217,70,239,0.5)' }}
                whileTap={{ scale: 0.97 }}
                type="button"
                suppressHydrationWarning
                className={`rounded-full px-[clamp(1.75rem,3.5vw,3rem)] py-[clamp(0.55rem,1vw,0.75rem)] text-[clamp(0.75rem,1vw,0.875rem)] font-extrabold transition hover:brightness-105 ${
                  isDarkMode 
                    ? 'bg-[#f5c400] text-[#140d3d] shadow-[0_4px_20px_rgba(245,196,0,0.4)]' 
                    : 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white shadow-[0_4px_20px_rgba(217,70,239,0.3)]'
                }`}
              >
                Get Started
              </motion.button>
            </div>
          </Reveal>

          {/* ── Gold divider ── */}
          <Reveal delay={0.08} className="relative mt-[clamp(3rem,6vw,5rem)]">
            <div className={`relative left-1/2 h-[2px] w-screen -translate-x-1/2 bg-gradient-to-r from-transparent ${isDarkMode ? 'via-[#f4bf1a]' : 'via-[#9333ea]/30'} to-transparent`} />
            <div className={`relative left-1/2 h-8 w-screen -translate-x-1/2 bg-gradient-to-b ${isDarkMode ? 'from-[#f4bf1a]/14 via-[#f4bf1a]/5' : 'from-[#9333ea]/5 via-[#9333ea]/2'} to-transparent blur-[1px]`} />
          </Reveal>

          {/* ── Contact heading ── */}
          <Reveal delay={0.1} className="mt-[clamp(2.5rem,5vw,4rem)] text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#a855f7]/40 bg-[#a855f7]/12 px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-[#c084fc]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a855f7]" />
              Get In Touch
            </span>

            <h3 className="mt-5 text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.06] tracking-[-0.025em]">
              Contact{' '}
              <span className="relative inline-block">
                Us
                <span
                  className={`absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r ${isDarkMode ? 'from-[#a855f7] to-[#c026d3]' : 'from-[#9333ea] to-[#ec4899]'}`}
                  aria-hidden
                />
              </span>
            </h3>

            <p className={`mx-auto mt-4 max-w-[560px] text-[clamp(0.8rem,1.2vw,0.9375rem)] leading-relaxed ${isDarkMode ? 'text-white/55' : 'text-[#616170]'}`}>
              Connect with our deployment team to scale your architecture globally.
            </p>
          </Reveal>

          {/* ── Form + Globe ── */}
          <div className="relative mx-auto mt-[clamp(2rem,4vw,3.5rem)] grid w-full max-w-[1100px] items-center gap-8 sm:grid-cols-[1fr_1fr] md:gap-10 lg:gap-14">

            {/* Form */}
            <Reveal x={-24} delay={0.14}>
              <div className={`w-full rounded-[2rem] border p-[clamp(1.5rem,3vw,2.5rem)] shadow-[0_24px_60px_rgba(5,4,22,0.5)] ${
                isDarkMode ? 'border-white/12 bg-[#10164a]/86' : 'border-[#e5e5ed] bg-white shadow-[0_16px_40px_rgba(20,20,50,0.06)]'
              }`}>

                <h4 className={`text-[clamp(1.1rem,2vw,1.5rem)] font-extrabold uppercase tracking-[0.02em] ${isDarkMode ? 'text-white' : 'text-[#120533]'}`}>
                  Get in touch with us
                </h4>
                <p className={`mt-1.5 text-[clamp(0.7rem,0.9vw,0.8125rem)] ${isDarkMode ? 'text-white/40' : 'text-[#616170]'}`}>
                  We'll respond within 24 hours.
                </p>

                <div className="mt-6 space-y-4">
                  {[
                    { id: 'contact-name',    label: 'Full Name',     type: 'text',  placeholder: 'Juan Dela Cruz' },
                    { id: 'contact-company', label: 'Company Name',  type: 'text',  placeholder: 'Acme Corp' },
                    { id: 'contact-email',   label: 'Email Address', type: 'email', placeholder: 'you@company.com' },
                  ].map(({ id, label, type, placeholder }) => (
                    <div key={id}>
                      <label
                        className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-[#616170]'}`}
                        htmlFor={id}
                      >
                        {label}
                      </label>
                      <input
                        id={id}
                        type={type}
                        placeholder={placeholder}
                        className={`h-[clamp(2.25rem,3vw,2.75rem)] w-full rounded-xl border px-4 text-[clamp(0.8rem,1vw,0.875rem)] transition focus:outline-none focus:ring-1 ${
                          isDarkMode 
                            ? 'border-white/8 bg-[#192058] text-white placeholder:text-white/25 focus:border-[#a855f7]/70 focus:bg-[#1e2870] focus:ring-[#a855f7]/30' 
                            : 'border-[#e5e5ed] bg-[#f8f8fb] text-[#120533] placeholder:text-[#888899] focus:border-[#9333ea]/40 focus:bg-[#fff] focus:ring-[#9333ea]/30'
                        }`}
                        suppressHydrationWarning
                      />
                    </div>
                  ))}

                  <div>
                    <label
                      className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-[#616170]'}`}
                      htmlFor="contact-message"
                    >
                      Message <span className={`normal-case ${isDarkMode ? 'text-white/30' : 'text-[#888899]'}`}>(optional)</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={3}
                      placeholder="Tell us about your project..."
                      className={`w-full resize-none rounded-xl border px-4 py-3 text-[clamp(0.8rem,1vw,0.875rem)] transition focus:outline-none focus:ring-1 ${
                        isDarkMode 
                          ? 'border-white/8 bg-[#192058] text-white placeholder:text-white/25 focus:border-[#a855f7]/70 focus:bg-[#1e2870] focus:ring-[#a855f7]/30' 
                          : 'border-[#e5e5ed] bg-[#f8f8fb] text-[#120533] placeholder:text-[#888899] focus:border-[#9333ea]/40 focus:bg-[#fff] focus:ring-[#9333ea]/30'
                      }`}
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 6px 28px rgba(139,61,255,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className={`mt-6 h-[clamp(2.5rem,3.5vw,3rem)] w-full rounded-xl text-[clamp(0.85rem,1.1vw,1rem)] font-extrabold leading-none text-white shadow-[0_4px_20px_rgba(139,61,255,0.4)] transition hover:brightness-110 ${
                    isDarkMode ? 'bg-gradient-to-r from-[#8b3dff] to-[#c026d3]' : 'bg-gradient-to-r from-[#9333ea] to-[#ec4899]'
                  }`}
                  suppressHydrationWarning
                >
                  Send Message
                </motion.button>

                <p className={`mt-3 text-center text-[10px] ${isDarkMode ? 'text-white/25' : 'text-[#888899]'}`}>
                  Your information is encrypted and never shared.
                </p>
              </div>
            </Reveal>

            {/* Globe */}
            <Reveal x={24} delay={0.18} className="hidden sm:block">
              <Globe />
            </Reveal>

          </div>
        </div>
      </div>

      {/* Bottom gold rule */}
      <div className={`h-[2px] w-full bg-gradient-to-r from-transparent ${isDarkMode ? 'via-[#f4bf1a]/50' : 'via-[#9333ea]/20'} to-transparent`} />
    </section>
  );
}