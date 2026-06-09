/**
 * Minimal structured logger.
 *
 * Wraps console.* with a consistent prefix so production logs are
 * grep-able by level and source. Intentionally has no third-party
 * dependency — drop-in replacement for `console.log`/`console.error`
 * that anywhere in the codebase can adopt incrementally.
 *
 * In production, logger.debug is a no-op so verbose tracing
 * doesn't pollute logs.
 */

const isProduction = process.env.NODE_ENV === 'production';

function format(level, scope, args) {
  const ts = new Date().toISOString();
  const prefix = scope ? `[${ts}] [${level}] [${scope}]` : `[${ts}] [${level}]`;
  return [prefix, ...args];
}

function logger(scope) {
  return {
    info: (...args) => console.log(...format('INFO', scope, args)),
    warn: (...args) => console.warn(...format('WARN', scope, args)),
    error: (...args) => console.error(...format('ERROR', scope, args)),
    debug: (...args) => {
      if (isProduction) return;
      console.log(...format('DEBUG', scope, args));
    },
  };
}

module.exports = logger;
