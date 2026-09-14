import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Mismos alias que el proyecto del sitio público (src/) — deliberado, para
// que el código portado desde ahí funcione sin tocar los imports.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@layout': path.resolve(__dirname, './src/layout'),
      '@context': path.resolve(__dirname, './src/context'),
      '@api': path.resolve(__dirname, './src/api'),
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
})
