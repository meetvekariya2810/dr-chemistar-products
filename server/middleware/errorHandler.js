exports.errorHandler = (err, req, res, next) => {
  console.error(`API Error [${req.method} ${req.originalUrl}]:`, err.stack || err.message);

  const isCorsRejection = /not allowed by CORS/i.test(err.message || '');

  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  if (isCorsRejection) statusCode = 403;

  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'CastError') statusCode = 404;

  const clientMessage =
    statusCode === 403 ? 'This origin is not allowed to call the API.'
      : statusCode === 404 ? 'Resource not found.'
        : statusCode === 400 ? (err.message || 'Invalid request.')
          : (err.message || 'Unable to complete the request. Please try again.');

  const body = {
    success: false,
    message: clientMessage,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' || process.env.DEBUG_ERRORS === 'true' ? err.stack : undefined
  };

  res.status(statusCode).json(body);
};
