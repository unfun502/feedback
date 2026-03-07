import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    proxy: {
      '/devapi': {
        target: 'https://api.devlab502.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/devapi/, ''),
        secure: true,
      },
    },
  },
});
