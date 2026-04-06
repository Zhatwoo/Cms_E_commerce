export function parseApiBaseList(raw: string | undefined | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ""));
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Returns a single API base URL from a potentially comma-separated NEXT_PUBLIC_API_URL.
 *
 * - In the browser: prefers matching current host; otherwise prefers non-localhost when running on LAN.
 * - On the server: returns the first valid entry (so dev server can still call backend via localhost).
 */
export function getApiBase(raw: string | undefined | null, fallback = "http://localhost:5000"): string {
  const bases = parseApiBaseList(raw);
  if (bases.length === 0) return fallback;

  const firstValid = bases.find((b) => safeHostname(b));
  if (!firstValid) return fallback;

  if (typeof window === "undefined") return firstValid;

  const currentHost = window.location.hostname;
  const isLocalHost = currentHost === "localhost" || currentHost === "127.0.0.1";

  const matchHost = bases.find((b) => safeHostname(b) === currentHost);
  if (matchHost) return matchHost;

  if (!isLocalHost) {
    const nonLocal = bases.find((b) => {
      const h = safeHostname(b);
      return !!h && h !== "localhost" && h !== "127.0.0.1";
    });
    if (nonLocal) return nonLocal;
  }

  const local = bases.find((b) => {
    const h = safeHostname(b);
    return !!h && (h === "localhost" || h === "127.0.0.1");
  });
  if (local) return local;

  return firstValid;
}

