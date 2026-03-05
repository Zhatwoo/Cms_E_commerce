const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'websitelink';

function toSubdomainSlug(subdomain: string): string {
  return subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || '';
}

/**
 * Full URL to open the published site (subdomain-based, like Vercel).
 * In dev: http://subdomain.localhost:3000 (proxy rewrites to /sites/subdomain). In production: https://subdomain.websitelink.
 */
export function getSubdomainSiteUrl(subdomain: string, origin: string | null): string {
  const slug = toSubdomainSlug(subdomain);
  if (!slug) return '#';
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    try {
      const u = new URL(origin);
      const port = u.port || (u.protocol === 'https:' ? '443' : '80');
      return `${u.protocol}//${slug}.localhost${port && port !== '80' && port !== '443' ? `:${port}` : ''}`;
    } catch {
      return `${origin.replace(/\/$/, '')}/sites/${encodeURIComponent(slug)}`;
    }
  }
  return `https://${slug}.${BASE_DOMAIN}`;
}
