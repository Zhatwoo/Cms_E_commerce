import http from 'node:http';
import https from 'node:https';
import { getBackendCandidates } from './apiBase';

/** Node fetch/undici blocks port 6000 (X11). Use http/https for server-side backend proxy calls. */
export async function serverFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const parsed = new URL(url);
  const lib = parsed.protocol === 'https:' ? https : http;
  const method = (init.method || 'GET').toUpperCase();
  const headers = normalizeHeaders(init.headers);
  const body = await readBody(init.body);

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (value == null) continue;
            if (Array.isArray(value)) {
              for (const entry of value) responseHeaders.append(key, entry);
            } else {
              responseHeaders.set(key, value);
            }
          }
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode || 500,
              headers: responseHeaders,
            })
          );
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

async function readBody(body: BodyInit | null | undefined): Promise<Buffer | null> {
  if (body == null) return null;
  if (typeof body === 'string') return Buffer.from(body);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  if (body instanceof Blob) return Buffer.from(await body.arrayBuffer());
  if (typeof (body as ReadableStream<Uint8Array>).getReader === 'function') {
    const reader = (body as ReadableStream<Uint8Array>).getReader();
    const chunks: Buffer[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }
  return null;
}

/** Try each configured backend base until one responds (multi-developer / LAN setups). */
export async function fetchBackend(apiPath: string, init: RequestInit = {}): Promise<Response> {
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const candidates = getBackendCandidates();
  let lastError: unknown;

  for (const base of candidates) {
    const url = `${base.replace(/\/$/, '')}${path}`;
    try {
      return await serverFetch(url, init);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Backend unreachable');
}
