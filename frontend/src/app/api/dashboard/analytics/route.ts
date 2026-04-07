import { NextRequest, NextResponse } from 'next/server';
import { getApiBase } from '@/lib/apiBase';

const BACKEND = getApiBase(process.env.NEXT_PUBLIC_API_URL);

/** Proxy GET /api/dashboard/analytics to backend so same-origin requests work. */
export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7days';
    const res = await fetch(
      `${BACKEND.replace(/\/$/, '')}/api/dashboard/analytics?period=${encodeURIComponent(period)}`,
      {
        method: 'GET',
        headers: { cookie },
        cache: 'no-store',
      }
    ).catch(async (err) => {
      // Local fallback: try 5001 if 5000 fails (standard port switch behavior in this project)
      if (BACKEND.includes('localhost:5000') || BACKEND.includes('127.0.0.1:5000')) {
        const fallback = BACKEND.includes('localhost') ? 'http://localhost:5001' : 'http://127.0.0.1:5001';
        return fetch(`${fallback}/api/dashboard/analytics?period=${encodeURIComponent(period)}`, {
          method: 'GET',
          headers: { cookie },
          cache: 'no-store',
        });
      }
      throw err;
    });

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
