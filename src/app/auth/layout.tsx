import { Outfit } from 'next/font/google';

const outfit = Outfit({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${outfit.className} relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070525] px-4 py-12`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(168,85,247,0.26),transparent_40%),radial-gradient(circle_at_85%_12%,rgba(255,204,0,0.12),transparent_35%)]" />
      <div className="relative z-10 w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}
