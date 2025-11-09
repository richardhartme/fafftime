import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { existsSync } from 'fs';

// Helper to create copy target only if file exists
const optionalCopy = (src: string, dest: string = '.') =>
  existsSync(src) ? { src, dest } : null;

const copyTargets = [
  // Images
  optionalCopy('src/assets/images/screenshot.png'),

  // Data files
  optionalCopy('src/assets/data/GreatBritishEscapades2025.fit'),

  // Favicon files - copy to root for proper browser detection
  optionalCopy('src/assets/icons/apple-touch-icon.png'),
  optionalCopy('src/assets/icons/favicon-32x32.png'),
  optionalCopy('src/assets/icons/favicon-16x16.png'),
  optionalCopy('src/assets/icons/favicon.ico'),
  optionalCopy('src/assets/icons/android-chrome-192x192.png'),
  optionalCopy('src/assets/icons/android-chrome-512x512.png'),
  optionalCopy('src/site.webmanifest'),
].filter((target): target is { src: string; dest: string } => target !== null);

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: copyTargets,
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
