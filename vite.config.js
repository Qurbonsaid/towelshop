import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Towelshop',
        short_name: 'Towelshop',
        description: 'Sartaroshxonalar uchun mobil savdo va yig\'im tizimi',
        theme_color: '#059669',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        lang: 'uz-Latn-UZ',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
