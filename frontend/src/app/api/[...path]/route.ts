import { NextRequest, NextResponse } from 'next/server';
import { getApiBase } from '@/lib/apiBase';

const BACKEND = getApiBase(process.env.NEXT_PUBLIC_API_URL);

function buildBackendUrl(path: string[]) {
  const safePath = Array.isArray(path) ? path.map((part) => encodeURIComponent(part)).join('/') : '';
  return `${BACKEND.replace(/\/$/, '')}/api/${safePath}`;
}

async function proxy(request: NextRequest, method: string, pathArray: string[]) {
  try {
    const target = buildBackendUrl(pathArray || []);
    const url = new URL(request.url);
    const search = url.search || '';
    const cookie = request.headers.get('cookie') || '';
    const contentType = request.headers.get('content-type') || '';

    const headers: HeadersInit = {};
    if (cookie) headers.cookie = cookie;
    if (contentType) headers['content-type'] = contentType;

    const init: RequestInit = {
      method,
      headers,
      cache: 'no-store',
    };

    if (!['GET', 'HEAD'].includes(method)) {
      init.body = await request.text();
    }

    const res = await fetch(`${target}${search}`, init).catch(async (err) => {
      // Local fallback: try 5001 if 5000 fails (standard port switch behavior in this project)
      if (target.includes('localhost:5000') || target.includes('127.0.0.1:5000')) {
        const fallbackTarget = target.replace(/:5000\//, ':5001/');
        return fetch(`${fallbackTarget}${search}`, init);
      }
      throw err;
    });
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
    console.error('[API Proxy Error]', error);
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
