import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        content: 'index.tsx', // Entry point
      },
      output: {
        entryFileNames: 'dist/[name].js',
        assetFileNames: 'dist/[name].[ext]', // For CSS
        dir: '.', // Output in root so manifest finds it easily
      },
    },
    // Ensure we don't code-split, we need one file for the extension
    cssCodeSplit: false,
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  }
});