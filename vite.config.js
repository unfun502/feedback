import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'devlab502',
      project: 'devlab502-workers',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: 'hidden',
  },
  server: {
    proxy: {
      '/devapi': {
        target: 'https://api.devlab502.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/devapi/, ''),
        secure: true,
      },
      '/api/upload': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
