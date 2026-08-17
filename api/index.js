import connectDB from '../server/config/db.js';

let app;

async function getApp() {
  if (!app) {
    const serverModule = await import('../server/server.js');
    app = serverModule.default || serverModule;
  }
  return app;
}

export default async function handler(req, res) {
  try {
    // Ensure MongoDB connection is initialized before processing request
    await connectDB();

    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (err) {
    console.error('[vercel-api-error]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Vercel Serverless Execution Failed',
      message: err.message,
      stack: err.stack
    }));
  }
}
