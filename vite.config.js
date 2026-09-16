import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Christ is King — the Bible in Latin and English',
        short_name: 'Christ is King',
        description: "Read Jerome's Vulgate with the Douay-Rheims beside it, track every verse, and see each chapter in its time, place and art.",
        theme_color: '#f8f5ec',
        background_color: '#f8f5ec',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        globIgnores: ['**/data/text/**', '**/data/xref/**', '**/data/speakers/**', '**/data/latin.json', '**/art/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/data/'),
            handler: 'CacheFirst',
            options: { cacheName: 'bible-data', expiration: { maxEntries: 1200, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/art/'),
            handler: 'CacheFirst',
            options: { cacheName: 'art', expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://en.wikipedia.org' || url.origin === 'https://upload.wikimedia.org',
            handler: 'CacheFirst',
            options: { cacheName: 'wiki', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 180 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
});
