import type { Metadata } from 'next';

type Props = { params: Promise<{ subdomain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const slug = subdomain?.trim().toLowerCase() || 'site';
  const siteName = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: siteName,
    robots: 'index, follow',
  };
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="published-site bg-white" style={{ minHeight: '100vh', width: '100%', isolation: 'isolate' }}>
      {children}
    </div>
  );
}
