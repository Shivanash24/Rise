import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'assets',
    emptyOutDir: false, // Don't wipe the assets directory since Shopify has its own assets
    rollupOptions: {
      input: {
        'rise-main': resolve(__dirname, 'src/main.js'),
        'rise-styles': resolve(__dirname, 'src/main.css')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name][extname]' // Outputs rise-styles.css
      }
    }
  }
});
