function parseUrlList(raw) {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ""));
}

function isValidUrl(url) {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Picks the first valid URL from a possibly comma-separated env value.
 * Keeps a safe localhost fallback so dev still works out of the box.
 */
function getFirstUrl(raw, fallback) {
  const list = parseUrlList(raw);
  const firstValid = list.find(isValidUrl);
  return firstValid || fallback.replace(/\/+$/, "");
}

module.exports = { parseUrlList, getFirstUrl };

