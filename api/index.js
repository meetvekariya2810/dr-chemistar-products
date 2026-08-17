import express from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let serverApp;
try {
  serverApp = require('../server/server.js');
} catch (err) {
  console.error('[vercel-api] Error loading server.js:', err);
}

const app = express();
app.use((req, res, next) => {
  if (serverApp) {
    return serverApp(req, res, next);
  }
  res.status(500).json({
    success: false,
    error: 'Serverless initialization failed',
    message: 'Backend server failed to initialize on Vercel'
  });
});

export default app;
