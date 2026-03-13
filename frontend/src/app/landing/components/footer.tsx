'use client';

import Link from 'next/link';

const QUICK_LINKS = [
  { label: 'About',   href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Support', href: '/support' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy',   href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy',    href: '/cookies' },
];

const SOCIAL_LINKS = [
  {
    label: 'Twitter / X',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
];

export function Footer({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const year = new Date().getFullYear();

  const bg        = isDarkMode ? 'bg-[#0a0141]'    : 'bg-white';
  const text      = isDarkMode ? 'text-white'       : 'text-[#120533]';
  const muted     = isDarkMode ? 'text-white/50'    : 'text-[#616170]';
  const subtle    = isDarkMode ? 'text-white/30'    : 'text-[#888899]';
  const divider   = isDarkMode ? 'border-white/8'   : 'border-[#e5e5ed]';
  const cardBg    = isDarkMode ? 'bg-[#0d1733]'     : 'bg-white';
  const cardBorder= isDarkMode ? 'border-white/8'   : 'border-[#e5e5ed]';
  const linkHover = isDarkMode ? 'hover:text-white' : 'hover:text-[#120533]';
  const socialBg  = isDarkMode
    ? 'border-white/10 bg-white/5 text-white/60 hover:border-[#a855f7]/60 hover:bg-[#a855f7]/10 hover:text-white'
    : 'border-[#e5e5ed] bg-[#f8f8fb] text-[#888899] hover:border-[#9333ea]/40 hover:bg-[#9333ea]/5 hover:text-[#9333ea]';

  return (
    <footer className={`relative w-full overflow-hidden ${bg} ${text}`}>

      {/* ── Faint grid overlay (dark only) ── */}
      {isDarkMode && (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.013)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.013)_1px,transparent_1px)] bg-[size:56px_56px]" />
      )}

      {/* ── Ambient glows (dark only) ── */}
      {isDarkMode && (
        <>
          <div className="pointer-events-none absolute left-[-8%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[#7c3aed]/10 blur-[130px]" />
          <div className="pointer-events-none absolute bottom-[-8%] right-[-6%] h-[400px] w-[400px] rounded-full bg-[#d946ef]/7 blur-[110px]" />
        </>
      )}

      {/* ── Top gold rule ── */}
      <div className={`h-[2px] w-full bg-gradient-to-r from-transparent ${isDarkMode ? 'via-[#f4bf1a]' : 'via-[#9333ea]/30'} to-transparent`} />

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16">

        {/* ════════════════════════════════════════
            CTA HERO BAND
        ════════════════════════════════════════ */}
        <div className="flex flex-col items-start justify-between gap-8 py-[clamp(3rem,6vw,5.5rem)] sm:flex-row sm:items-center">
          <div>
            {/* Eyebrow */}
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
              isDarkMode
                ? 'border-[#f4bf1a]/30 bg-[#f4bf1a]/10 text-[#f4bf1a]'
                : 'border-[#9333ea]/30 bg-[#9333ea]/10 text-[#9333ea]'
            }`}>
              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${isDarkMode ? 'bg-[#f4bf1a]' : 'bg-[#9333ea]'}`} />
              Start for free today
            </span>

            <h2 className="mt-4 text-[clamp(2rem,5vw,4.5rem)] font-black leading-[1.03] tracking-[-0.03em]">
              Ready to build your
              <br />
              <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-[#f5c400] via-[#ffdd55] to-[#f5c400]' : 'from-[#9333ea] via-[#c026d3] to-[#ec4899]'}`}>
                online store?
              </span>
            </h2>

            <p className={`mt-4 max-w-[480px] text-[clamp(0.8rem,1.1vw,0.9375rem)] leading-relaxed ${muted}`}>
              Join 4,000+ businesses already building with Centric.
              No credit card required.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-center">
            <button
              type="button"
              suppressHydrationWarning
              className={`group relative overflow-hidden rounded-full px-[clamp(1.75rem,3vw,3rem)] py-[clamp(0.8rem,1.5vw,1.1rem)] text-[clamp(0.9rem,1.3vw,1.1rem)] font-extrabold text-white transition-all duration-300 hover:brightness-110 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#9d3fff] shadow-[0_6px_32px_rgba(139,61,255,0.45)] hover:shadow-[0_8px_40px_rgba(139,61,255,0.65)]' 
                  : 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] shadow-[0_6px_32px_rgba(217,70,239,0.3)] hover:shadow-[0_8px_40px_rgba(217,70,239,0.45)]'
              }`}
            >
              {/* Shimmer sweep */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/15 transition-transform duration-700 group-hover:translate-x-[200%]" />
              Initialize Project
            </button>
            <span className={`text-[11px] ${subtle}`}>Free plan · No card needed</span>
          </div>
        </div>

        {/* ════════════════════════════════════════
            LINKS GRID
        ════════════════════════════════════════ */}
        <div className={`border-t ${divider}`}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-[clamp(2.5rem,5vw,4.5rem)] sm:grid-cols-2 md:grid-cols-4 lg:gap-x-10 xl:gap-x-16">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
                <span className={`text-[clamp(1.2rem,2vw,1.6rem)] font-black tracking-tight ${text}`}>Centric</span>
              </div>
              <p className={`mt-4 text-[clamp(0.75rem,1vw,0.875rem)] leading-relaxed ${muted}`}>
                We help businesses get online faster. Build, launch, and grow your store with our all-in-one platform.
              </p>

              {/* Social icons */}
              <div className="mt-5 flex items-center gap-2">
                {SOCIAL_LINKS.map(({ label, href, icon }) => (
                  <Link
                    key={label}
                    href={href}
                    aria-label={label}
                    className={`grid h-8 w-8 place-items-center rounded-full border transition-all duration-200 ${socialBg}`}
                  >
                    {icon}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className={`text-[clamp(0.65rem,0.9vw,0.75rem)] font-bold uppercase tracking-[0.18em] ${
                isDarkMode ? 'text-[#f5c400]' : 'text-[#f5a213]'
              }`}>
                Quick Links
              </h3>
              <ul className="mt-4 space-y-3">
                {QUICK_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`group flex items-center gap-2 text-[clamp(0.8rem,1vw,0.9rem)] font-medium transition-all duration-150 ${muted} ${linkHover}`}
                    >
                      <span className={`h-px w-4 shrink-0 bg-current opacity-0 transition-all duration-200 group-hover:w-5 group-hover:opacity-100`} />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className={`text-[clamp(0.65rem,0.9vw,0.75rem)] font-bold uppercase tracking-[0.18em] ${
                isDarkMode ? 'text-[#f5c400]' : 'text-[#f5a213]'
              }`}>
                Legal
              </h3>
              <ul className="mt-4 space-y-3">
                {LEGAL_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`group flex items-center gap-2 text-[clamp(0.8rem,1vw,0.9rem)] font-medium transition-all duration-150 ${muted} ${linkHover}`}
                    >
                      <span className="h-px w-4 shrink-0 bg-current opacity-0 transition-all duration-200 group-hover:w-5 group-hover:opacity-100" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className={`text-[clamp(0.65rem,0.9vw,0.75rem)] font-bold uppercase tracking-[0.18em] ${
                isDarkMode ? 'text-[#f5c400]' : 'text-[#f5a213]'
              }`}>
                Contact Us
              </h3>
              <ul className="mt-4 space-y-3">
                {[
                  { label: 'hello@centric.com',   href: 'mailto:hello@centric.com' },
                  { label: 'support@centric.com', href: 'mailto:support@centric.com' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className={`group flex items-center gap-2 text-[clamp(0.8rem,1vw,0.9rem)] font-medium transition-all duration-150 ${muted} ${linkHover}`}
                    >
                      <span className="h-px w-4 shrink-0 bg-current opacity-0 transition-all duration-200 group-hover:w-5 group-hover:opacity-100" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>

            
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            BOTTOM BAR
        ════════════════════════════════════════ */}
        <div className={`flex flex-col items-center justify-between gap-3 border-t pb-8 pt-6 sm:flex-row ${divider}`}>
          <p className={`text-[clamp(0.7rem,0.85vw,0.8125rem)] font-medium ${subtle}`}>
            © {year} Centric. All rights reserved.
          </p>
        </div>

      </div>

      {/* ── Bottom gold rule ── */}
      <div className={`h-[2px] w-full bg-gradient-to-r from-transparent ${isDarkMode ? 'via-[#f4bf1a]/60' : 'via-[#9333ea]/30'} to-transparent`} />
    </footer>
  );
}