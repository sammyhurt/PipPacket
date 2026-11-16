import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  // one script and one stylesheet, so the whole site can also be packed into a single preview page
  build: { outDir: 'dist', emptyOutDir: true, cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } },
});
