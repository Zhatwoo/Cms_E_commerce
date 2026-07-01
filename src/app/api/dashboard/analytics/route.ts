import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendBase } from '@/lib/apiBase';
import { serverFetch } from '@/lib/serverFetch';

/** Proxy GET /api/dashboard/analytics to backend so same-origin requests work. */
export async function GET(request: NextRequest) {
  try {
    const backend = resolveBackendBase();
    const cookie = request.headers.get('cookie') || '';
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7days';
    const res = await serverFetch(
      `${backend.replace(/\/$/, '')}/api/dashboard/analytics?period=${encodeURIComponent(period)}`,
      {
        method: 'GET',
        headers: { cookie },
        cache: 'no-store',
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[Analytics Proxy Error]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Proxy error' },
      { status: 502 }
    );
  }
}
