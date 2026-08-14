import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* The API is same-origin in production, so it must be same-origin in
   development too — otherwise cookies, paths and CORS all behave differently
   between the two and local success proves nothing. Vite proxies /api and
   /media to the back end, which keeps the front end's fetch calls identical in
   both environments: no base URL, no CORS, no credentials mode to get wrong. */
const API = process.env.VITE_API_TARGET ?? 'http://localhost:8091'

export default defineConfig({
  plugins: [react()],
  /* Pass VITE_USE_MOCK through explicitly. Relying on Vite to pick it up from
     the shell is not dependable, and the failure is silent and dangerous: the
     app quietly talks to the real API while you believe it is offline. */
  define: {
    'import.meta.env.VITE_USE_MOCK': JSON.stringify(process.env.VITE_USE_MOCK ?? 'false'),
  },
  server: {
    port: 5180,
    host: true,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/media': { target: API, changeOrigin: true },
    },
  },
  preview: {
    port: 5180,
    host: true,
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/media': { target: API, changeOrigin: true },
    },
  },
  build: { assetsInlineLimit: 0 },
})
