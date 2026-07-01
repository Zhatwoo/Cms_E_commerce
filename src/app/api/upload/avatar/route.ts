import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendBase } from '@/lib/apiBase';
import { serverFetch } from '@/lib/serverFetch';

/** Proxy POST /api/upload/avatar (multipart) to backend POST /api/auth/avatar so cookies are sent. */
export async function POST(request: NextRequest) {
  try {
    const backend = resolveBackendBase();
    const cookie = request.headers.get('cookie') || '';
    const contentType = request.headers.get('content-type') || '';
    const body = await request.arrayBuffer();

    const res = await serverFetch(`${backend.replace(/\/$/, '')}/api/auth/avatar`, {
      method: 'POST',
      headers: {
        cookie,
        ...(contentType ? { 'content-type': contentType } : {}),
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
