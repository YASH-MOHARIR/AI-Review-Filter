import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: 'index.tsx',
      },
      output: {
        entryFileNames: 'content.js',
        assetFileNames: (assetInfo) => {
           if (assetInfo.name && assetInfo.name.endsWith('.css')) {
             return 'content.css';
           }
           return '[name].[ext]';
        },
      },
    },
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  }
});