import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'websitelink';

// Paths that should NEVER be rewritten by the subdomain proxy — they belong to the Next.js app itself.
const PASSTHROUGH_PREFIXES = [
  '/sites/',
  '/api/',
  '/_next/',
  '/auth/',
  '/m_dashboard/',
  '/admindashboard/',
  '/design/',
  '/landing/',
  '/s/',
  '/site/',
];

/**
 * When the request host is subdomain.base (e.g. sampledomain3.websitelink or sampledomain3.localhost),
 * rewrite to /sites/[subdomain] so the public site page runs. URL bar stays subdomain-based.
 * Paths that already belong to the Next.js app (e.g. /sites/*, /api/*, /_next/*) are passed through.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0];

  let subdomain: string | null = null;
  if (hostname.endsWith('.localhost')) {
    subdomain = hostname.slice(0, -'.localhost'.length).trim();
  } else if (BASE_DOMAIN && hostname.endsWith('.' + BASE_DOMAIN)) {
    subdomain = hostname.slice(0, -(BASE_DOMAIN.length + 1)).trim();
  }

  if (!subdomain || subdomain === 'www') {
    return NextResponse.next();
  }

  const normalized = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!normalized) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // If the path already belongs to a Next.js app route, don't rewrite it.
  const isPassthrough = PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPassthrough) {
    return NextResponse.next();
  }

  // Only rewrite the root path (and any unknown path) to the storefront.
  const url = request.nextUrl.clone();
  url.pathname = `/sites/${encodeURIComponent(normalized)}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all pathnames except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
