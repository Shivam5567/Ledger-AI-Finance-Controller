import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        timeout: 0,       // no timeout — needed for SSE (chat + agent run)
        proxyTimeout: 0,  // no upstream timeout for long-lived streams
      },
    },
  },
});
