import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Proxy POST /api/auth/avatar (multipart) to backend so cookies are sent. */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar');
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'No file uploaded. Use field name "avatar".' },
        { status: 400 }
      );
    }
    const cookie = request.headers.get('cookie') || '';
    const body = new FormData();
    body.append('avatar', file);
    const res = await fetch(`${BACKEND.replace(/\/$/, '')}/api/auth/avatar`, {
      method: 'POST',
      headers: { cookie },
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
