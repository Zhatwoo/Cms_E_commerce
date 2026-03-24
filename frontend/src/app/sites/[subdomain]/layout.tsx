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
    <div className="published-site" style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center', // vertical centering
      alignItems: 'center',     // horizontal centering
      isolation: 'isolate',
      background: '#fff',
    }}>
      {children}
    </div>
  );
}
