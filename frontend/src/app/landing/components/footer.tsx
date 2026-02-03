import Link from 'next/link';

const QUICK_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Support', href: '/support' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="m-0 flex min-h-0 flex-1 flex-col justify-end w-full border-t border-white/10 bg-transparent px-6 pt-12 pb-6 md:px-10 md:pt-16 md:pb-8">
      <div className="mx-auto max-w-6xl">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand / About */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-white">Company</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              We help businesses get online faster. Build your website today with our platform.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/70 transition hover:text-white hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">Legal</h3>
            <ul className="mt-4 space-y-2">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/70 transition hover:text-white hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>
                <a href="mailto:hello@example.com" className="transition hover:text-white hover:underline">
                  hello@example.com
                </a>
              </li>
              <li>Support: support@example.com</li>
            </ul>
          </div>
        </div>

        {/* Copyright — minimal bottom spacing so no gap below */}
        <div className="mt-12 border-t border-white/10 pt-8 pb-0 text-center">
          <p className="mb-0 text-xs text-white/50 md:text-sm">
            © {year} Company Name. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
