import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use jsdom for DOM testing
    environment: 'jsdom',
    
    // Test file patterns now pick up colocated tests under src/
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Global test APIs (no need to import describe, it, expect)
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'webpack.config.js',
        'vitest.config.js',
        '**/*.test.*',
        '**/*.spec.*'
      ]
    }
  },
  
  // Resolve configuration similar to webpack
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
