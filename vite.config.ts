import { defineConfig } from 'vite';

export default defineConfig({
  base: '/static/editor/',
  build: {
    target: 'ES2022',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    copyPublicDir: true  // Make sure public files are copied
  },
  server: {
    port: 5173,
    open: true
  }
});
