import { NextRequest, NextResponse } from 'next/server';
import { getApiBase } from '@/lib/apiBase';

const BACKEND = getApiBase(process.env.NEXT_PUBLIC_API_URL);

function buildBackendUrl(path: string[]) {
  const safePath = Array.isArray(path) ? path.map((part) => encodeURIComponent(part)).join('/') : '';
  return `${BACKEND.replace(/\/$/, '')}/api/published-auth/${safePath}`;
}

async function proxy(request: NextRequest, method: string, params: { path?: string[] }) {
  try {
    const target = buildBackendUrl(params.path || []);
    const url = new URL(request.url);
    const search = url.search || '';
    const cookie = request.headers.get('cookie') || '';
    const contentType = request.headers.get('content-type') || '';
    const siteIdentifier = request.headers.get('x-site-identifier') || '';

    const headers: HeadersInit = {};
    if (cookie) headers.cookie = cookie;
    if (contentType) headers['content-type'] = contentType;
    if (siteIdentifier) headers['x-site-identifier'] = siteIdentifier;

    const init: RequestInit = {
      method,
      headers,
      cache: 'no-store',
    };

    if (!['GET', 'HEAD'].includes(method)) {
      init.body = await request.text();
    }

    const res = await fetch(`${target}${search}`, init);
    const body = await res.arrayBuffer();
    const nextRes = new NextResponse(body, {
      status: res.status,
    });

    const responseContentType = res.headers.get('content-type');
    if (responseContentType) {
      nextRes.headers.set('content-type', responseContentType);
    }

    const setCookieList =
      typeof (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (res.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
        : [];

    if (Array.isArray(setCookieList) && setCookieList.length > 0) {
      for (const cookieValue of setCookieList) {
        nextRes.headers.append('set-cookie', cookieValue);
      }
    } else {
      const singleSetCookie = res.headers.get('set-cookie');
      if (singleSetCookie) nextRes.headers.append('set-cookie', singleSetCookie);
    }

    return nextRes;
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Proxy error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, 'GET', await context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, 'POST', await context.params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, 'PUT', await context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, 'PATCH', await context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, 'DELETE', await context.params);
}
