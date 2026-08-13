import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The dev server proxies /api to the Express backend so the browser always talks
 * to its OWN origin. Without this the frontend had to hardcode an absolute
 * http://localhost:<backend-port> URL, which turns every backend hiccup into an
 * opaque cross-origin "Failed to fetch" and breaks whenever Vite falls back to a
 * different port (3000 taken -> 3001 -> 3002 ...).
 *
 * The proxy target follows PORT from .env (the same variable server.js listens
 * on), so the two halves cannot drift apart.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_DEV_API_TARGET || `http://localhost:${env.PORT || 5001}`;

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  };
});
