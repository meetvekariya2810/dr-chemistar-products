/**
 * Last stop for anything a route threw.
 *
 * The full error (message + stack) goes to the server log where the operator
 * can read it; the client gets a status code and a sentence. Stack traces used
 * to be returned in the response body whenever NODE_ENV was anything other than
 * 'production' - which is the default on most hosts, so they leaked file paths
 * and query internals to real visitors. Returning them is now opt-in via
 * DEBUG_ERRORS=true.
 */
exports.errorHandler = (err, req, res, next) => {
  console.error(`API Error [${req.method} ${req.originalUrl}]:`, err.stack || err.message);

  // The CORS origin check rejects by throwing; that is a refusal, not a crash.
  const isCorsRejection = /not allowed by CORS/i.test(err.message || '');

  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  if (isCorsRejection) statusCode = 403;

  // Mongoose validation failures are the caller's fault, not the server's.
  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'CastError') statusCode = 404;

  const clientMessage =
    statusCode === 403 ? 'This origin is not allowed to call the API.'
      : statusCode === 404 ? 'Resource not found.'
        : statusCode === 400 ? (err.message || 'Invalid request.')
          : 'Unable to complete the request. Please try again.';

  const body = { success: false, message: clientMessage };
  if (process.env.DEBUG_ERRORS === 'true') {
    body.debug = { name: err.name, message: err.message, stack: err.stack };
  }

  res.status(statusCode).json(body);
};
