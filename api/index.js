import express from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let app;
try {
  app = require('../server/server.js');
} catch (err) {
  app = express();
  app.use(express.json());
  app.all('*', (req, res) => {
    res.status(500).json({
      success: false,
      error: 'Serverless initialization failed',
      message: err.message,
      stack: err.stack
    });
  });
}

export default app;
