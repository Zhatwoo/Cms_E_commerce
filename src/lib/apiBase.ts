export function parseApiBaseList(raw: string | undefined | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\r$/, ""))
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ""));
}

/** Wrap IPv6 hosts in brackets for URL construction. */
function hostForUrl(host: string): string {
  const h = host.trim();
  if (!h) return h;
  if (h.includes(":") && !h.startsWith("[")) return `[${h}]`;
  return h;
}

function isValidApiBase(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname) return false;
    if (parsed.port) {
      const portNum = Number(parsed.port);
      if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) return false;
    }
    return true;
  } catch {
    return false;
  }
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
export function getApiBase(raw: string | undefined | null, fallback = "http://127.0.0.1:6000"): string {
  const envBases = parseApiBaseList(raw);
  
  // 1. Merge with dynamic LAN IP if provided by next-dev.js
  // We infer the port from the first entry in raw or default to 5000
  const dynamicIp = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_DEV_LAN_IP : undefined;
  const bases = [...envBases];
  
  const lanIp = (dynamicIp || "").trim().replace(/\r$/, "");
  if (lanIp && lanIp !== "127.0.0.1" && lanIp !== "localhost") {
    let port = "5000";
    if (envBases.length > 0) {
      try {
        port = new URL(envBases[0]).port || "5000";
      } catch {
        port = "5000";
      }
    }
    const dynamicUrl = `http://${hostForUrl(lanIp)}:${port}`;
    if (isValidApiBase(dynamicUrl) && !bases.includes(dynamicUrl)) {
      bases.push(dynamicUrl);
    }
  }

  if (bases.length === 0) return fallback;

  const firstValid = bases.find((b) => isValidApiBase(b) && safeHostname(b));
  if (!firstValid) return fallback;

  // Next.js API proxy runs on the server — always prefer explicit env URL (localhost/127.0.0.1).
  if (typeof window === "undefined") {
    const fromEnv = envBases.find((b) => isValidApiBase(b) && safeHostname(b));
    if (fromEnv) return fromEnv;
    return firstValid;
  }

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

/** Backend base URL for Next.js API proxy routes (resolved per request). */
export function resolveBackendBase(fallback = "http://127.0.0.1:6000"): string {
  return getApiBase(process.env.NEXT_PUBLIC_API_URL, fallback);
}

