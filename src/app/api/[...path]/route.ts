import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/serverFetch';

function buildApiPath(path: string[], search: string) {
  const safePath = Array.isArray(path) ? path.map((part) => encodeURIComponent(part)).join('/') : '';
  return `/api/${safePath}${search}`;
}

async function proxy(request: NextRequest, method: string, pathArray: string[]) {
  try {
    const url = new URL(request.url);
    const search = url.search || '';
    const apiPath = buildApiPath(pathArray || [], search);
    const cookie = request.headers.get('cookie') || '';
    const contentType = request.headers.get('content-type') || '';
    const authorization = request.headers.get('authorization') || '';
    const projectId = request.headers.get('x-project-id') || '';
    const siteIdentifier = request.headers.get('x-site-identifier') || '';

    const headers: HeadersInit = {};
    if (cookie) headers.cookie = cookie;
    if (contentType) headers['content-type'] = contentType;
    if (authorization) headers.authorization = authorization;
    if (projectId) headers['x-project-id'] = projectId;
    if (siteIdentifier) headers['x-site-identifier'] = siteIdentifier;

    const init: RequestInit = {
      method,
      headers,
      cache: 'no-store',
    };

    if (!['GET', 'HEAD'].includes(method)) {
      init.body = await request.arrayBuffer();
    }

    const res = await fetchBackend(apiPath, init);
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
    }

    return nextRes;
  } catch (error) {
    console.error('[API Proxy Error]', { path: buildApiPath(pathArray || [], ''), error });
    return NextResponse.json({ success: false, message: 'Backend connection failed' }, { status: 502 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxy(request, 'GET', resolvedParams.path || []);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxy(request, 'POST', resolvedParams.path || []);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxy(request, 'PATCH', resolvedParams.path || []);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxy(request, 'PUT', resolvedParams.path || []);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxy(request, 'DELETE', resolvedParams.path || []);
}
