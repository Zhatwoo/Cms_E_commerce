// utils/caseHelper.js  —  snake_case ↔ camelCase for Supabase columns

function toSnake(str) {
  return str.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
}

function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Convert all keys of an object from camelCase → snake_case */
function keysToSnake(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [toSnake(k), v])
  );
}

/** Convert all keys of an object from snake_case → camelCase */
function keysToCamel(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [toCamel(k), v])
  );
}

module.exports = { toSnake, toCamel, keysToSnake, keysToCamel };
