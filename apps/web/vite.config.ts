/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // PWA: bisa dipasang, kerangka aplikasi dan data terakhir tersedia offline (baca saja);
    // hitungan dzikir offline ditangani antreannya sendiri.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Muhasabah Daily',
        short_name: 'Muhasabah',
        description: 'Produktivitas Muslim di sekitar waktu sholat.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#fafaf9',
        theme_color: '#047857',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Ambil alih halaman sejak kunjungan pertama agar data langsung tersimpan untuk offline.
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Tangkapan layar landing page tidak perlu ikut cache offline.
        globIgnores: ['landing/**'],
        // Notifikasi Web Push (pengingat sholat dan agenda).
        importScripts: ['/push-sw.js'],
        runtimeCaching: [
          {
            // Mode offline: GET data API memakai jaringan dulu, cache bila gagal. Cache dihapus
            // saat keluar/masuk akun (features/auth/stores/offline-snapshot.ts).
            urlPattern: ({ url, request, sameOrigin }) =>
              sameOrigin &&
              request.method === 'GET' &&
              url.pathname.startsWith('/api/v1/') &&
              !/^\/api\/v1\/(auth|push|health)(\/|$)/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 400, maxAgeSeconds: 30 * 24 * 3600 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    host: process.env.VITE_HOST ?? 'localhost',
    // Proxy membuat API tampil satu origin dengan web, sehingga cookie refresh SameSite=Lax berjalan.
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
