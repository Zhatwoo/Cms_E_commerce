import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/serverFetch';

/** Proxy GET /api/domains/management to backend so same-origin requests work. */
export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const res = await fetchBackend('/api/domains/admin/management', {
      method: 'GET',
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Proxy error' },
      { status: 500 }
    );
  }
}
