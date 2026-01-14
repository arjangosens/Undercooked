import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    },
    proxy: {
      '/health': 'http://localhost:3000',
      '/api': 'http://localhost:3000'
    }
  }
});
