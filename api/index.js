import express from 'express';

let app;
let initError = null;

try {
  const serverModule = await import('../server/server.js');
  app = serverModule.default || serverModule;
} catch (err) {
  initError = err;
  console.error('[vercel-init-error]', err);
}

export default function handler(req, res) {
  if (initError || !app) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Vercel Serverless Initialization Error',
      message: initError ? initError.message : 'App failed to load',
      stack: initError ? initError.stack : null
    }));
  }
  return app(req, res);
}
