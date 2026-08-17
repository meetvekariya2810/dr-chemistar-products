import app from './server/server.js';

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[local-server] Express API running on http://localhost:${PORT}`);
});
