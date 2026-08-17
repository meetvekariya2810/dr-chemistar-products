let app;
try {
  app = require('../server/server.js');
} catch (err) {
  const express = require('express');
  app = express();
  app.use(express.json());
  app.all('*', (req, res) => {
    res.status(500).json({
      success: false,
      error: 'Serverless initialization failed',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
}

module.exports = app;
