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
  const envBases = parseApiBaseList(raw);
  
  // 1. Merge with dynamic LAN IP if provided by next-dev.js
  // We infer the port from the first entry in raw or default to 5000
  const dynamicIp = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_DEV_LAN_IP : undefined;
  const bases = [...envBases];
  
  if (dynamicIp && dynamicIp !== "127.0.0.1" && dynamicIp !== "localhost") {
    const port = envBases.length > 0 ? (new URL(envBases[0]).port || "5000") : "5000";
    const dynamicUrl = `http://${dynamicIp}:${port}`;
    if (!bases.includes(dynamicUrl)) {
      bases.push(dynamicUrl);
    }
  }

  if (bases.length === 0) return fallback;

  const firstValid = bases.find((b) => safeHostname(b));
  if (!firstValid) return fallback;

  if (typeof window === "undefined") return firstValid;

  const currentHost = window.location.hostname;
  const isLocalHost = currentHost === "localhost" || currentHost === "127.0.0.1";

  // Exact match (e.g. running on IP, and IP is in list)
  const matchHost = bases.find((b) => safeHostname(b) === currentHost);
  if (matchHost) return matchHost;

  // 2. Fallback for localhost: If we are on localhost but it's not in the list,
  // we still want to use localhost instead of a random IP if possible.
  if (isLocalHost) {
    const local = bases.find((b) => {
      const h = safeHostname(b);
      return !!h && (h === "localhost" || h === "127.0.0.1");
    });
    if (local) return local;

    // Construct a localhost URL using the port of the first valid entry
    try {
      const url = new URL(firstValid);
      return `${url.protocol}//localhost${url.port ? ":" + url.port : ""}`;
    } catch {
      return fallback;
    }
  }

  // 3. Fallback for LAN: If we are on LAN (not localhost), prefer non-localhost entries
  const nonLocal = bases.find((b) => {
    const h = safeHostname(b);
    return !!h && h !== "localhost" && h !== "127.0.0.1";
  });
  if (nonLocal) return nonLocal;

  return firstValid;
}

