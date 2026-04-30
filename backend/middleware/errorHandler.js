/**
 * Central Express error handler.
 *
 * Wired in server.js as the LAST middleware (after all routes).
 * Controllers can either:
 *   - call `next(err)` and let this handler respond, or
 *   - send their own response (existing behavior is preserved).
 *
 * Throwing an Error with a `.status` numeric property makes the
 * handler use that status code; otherwise 500.
 */

const logger = require('../utils/logger')('errorHandler');

function errorHandler(err, req, res, _next) {
  // Already handled by another middleware or controller
  if (res.headersSent) {
    return _next(err);
  }

  // Body-parser payload-too-large is a known case worth a friendlier message
  if (err && (err.type === 'entity.too.large' || err.name === 'PayloadTooLargeError')) {
    return res.status(413).json({
      success: false,
      message: 'Payload too large. Reduce image size/count and try again.',
    });
  }

  const status = Number(err?.status || err?.statusCode) || 500;
  const isClientError = status >= 400 && status < 500;

  // Log with stack on the server, never leak the stack to clients
  if (isClientError) {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status}: ${err.message}`);
  } else {
    logger.error(`${req.method} ${req.originalUrl} -> ${status}`, err.stack || err);
  }

  res.status(status).json({
    success: false,
    message: err?.publicMessage || (isClientError ? err.message : 'Something went wrong!'),
    error: process.env.NODE_ENV === 'development' ? err?.message : undefined,
  });
}

module.exports = errorHandler;
