import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Output goes to client/dist — Vercel picks this up automatically
    outDir: 'dist',
  },

  server: {
    port: 5173,
    // Dev-only proxy: forwards Socket.IO requests to the local Node server
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
