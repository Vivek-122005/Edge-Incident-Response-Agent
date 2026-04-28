import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: { outDir: 'dist' },
  server: {
    port: 5173,
    proxy: {
      '/incidents': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
      '/logs': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
      '/agents': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
