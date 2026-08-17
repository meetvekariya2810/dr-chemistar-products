let app;

function getApp() {
  if (!app) {
    app = require('../server/server.js');
  }
  return app;
}

module.exports = (req, res) => {
  try {
    const expressApp = getApp();

    // Vercel sends the original requested path in x-matched-path (e.g. /api/health or /api/admin/login)
    const matchedPath = req.headers['x-matched-path'];
    if (matchedPath && matchedPath.startsWith('/api')) {
      req.url = matchedPath;
    }

    return expressApp(req, res);
  } catch (err) {
    console.error('[vercel-api-error]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'Serverless Execution Failed',
      message: err.message,
      stack: err.stack
    }));
  }
};
