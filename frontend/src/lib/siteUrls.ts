const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'websitelink';

function toSubdomainSlug(subdomain: string): string {
  return subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || '';
}

/**
 * Full URL to open the published site.
 * In dev: uses path-based URL (localhost:3000/sites/subdomain) - more reliable than subdomain.localhost on some systems.
 * In production: https://subdomain.websitelink.
 */
export function getSubdomainSiteUrl(subdomain: string, origin: string | null): string {
  const slug = toSubdomainSlug(subdomain);
  if (!slug) return '#';
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    const base = origin.replace(/\/$/, '');
    return `${base}/sites/${encodeURIComponent(slug)}`;
  }
  return `https://${slug}.${BASE_DOMAIN}`;
}
