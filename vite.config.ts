import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    headers: {
      // CORS: allow preview host, restrictive in prod would be specific origins
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
      // Security headers (frontend dev server). Prod should also set via CDN/Express
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // CSP for dev: allow Paystack + images
      'Content-Security-Policy':
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://api.paystack.co https://images.unsplash.com https://res.cloudinary.com data: blob:; connect-src 'self' http://localhost:5000 https://api.paystack.co https://js.paystack.co;",
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
})
