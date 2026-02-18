import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Proxy error' },
      { status: 500 }
    );
  }
}
