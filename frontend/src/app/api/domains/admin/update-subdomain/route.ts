import { NextRequest, NextResponse } from 'next/server';
import { getApiBase } from '@/lib/apiBase';

const BACKEND = getApiBase(process.env.NEXT_PUBLIC_API_URL);

/** Proxy POST /api/domains/admin/update-subdomain to backend (same-origin so cookies are sent). */
export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${BACKEND.replace(/\/$/, '')}/api/domains/admin/update-subdomain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify(body),
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
