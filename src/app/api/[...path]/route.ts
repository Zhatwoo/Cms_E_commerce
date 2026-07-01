import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendBase } from '@/lib/apiBase';
import { serverFetch } from '@/lib/serverFetch';

function buildBackendUrl(path: string[]) {
  const backend = resolveBackendBase();
  const safePath = Array.isArray(path) ? path.map((part) => encodeURIComponent(part)).join('/') : '';
  return `${backend.replace(/\/$/, '')}/api/${safePath}`;
}

async function fetchWithLocalFallback(target: string, search: string, init: RequestInit) {
  try {
    return await serverFetch(`${target}${search}`, init);
  } catch (err) {
    const fallbacks: string[] = [];
    if (target.includes('localhost:6000')) fallbacks.push(target.replace('localhost:6000', '127.0.0.1:6000'));
    if (target.includes('127.0.0.1:6000')) fallbacks.push(target.replace('127.0.0.1:6000', 'localhost:6000'));
    if (target.includes('localhost:5000')) fallbacks.push(target.replace(':5000/', ':5001/'));
    if (target.includes('127.0.0.1:5000')) fallbacks.push(target.replace(':5000/', ':5001/'));

    for (const alt of fallbacks) {
       try {
        return await serverFetch(`${alt}${search}`, init);
      } catch {
        // try next fallback
      }
    }
    throw err;
  }
}

async function proxy(request: NextRequest, method: string, pathArray: string[]) {
  try {
    const target = buildBackendUrl(pathArray || []);
    const url = new URL(request.url);
    const search = url.search || '';
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

    const res = await fetchWithLocalFallback(target, search, init);
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
    console.error('[API Proxy Error]', { target: buildBackendUrl(pathArray || []), error });
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
