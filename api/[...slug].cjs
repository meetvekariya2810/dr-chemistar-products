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

    // Ensure req.url includes the /api prefix for Express routing
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
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
