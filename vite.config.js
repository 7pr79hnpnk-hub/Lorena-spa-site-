import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works from any sub-path (GitHub Pages, previews, static hosts).
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 2048,
    // The 3D chunk (three.js) is lazy-loaded after first paint.
    chunkSizeWarningLimit: 700,
  },
  server: { host: true },
});
