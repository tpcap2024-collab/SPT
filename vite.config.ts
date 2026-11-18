import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',

        includeAssets: [
          'spt-logo.png',
        ],

        manifest: {
          id: '/',

          name:
            'Smart Pallet Tracking',

          short_name:
            'SPT',

          description:
            'Smart Pallet Tracking for Warehouse Logistics',

          start_url: '/',

          scope: '/',

          display: 'standalone',

          orientation: 'portrait',

          background_color:
            '#f1f5f9',

          theme_color:
            '#155eef',

          lang: 'th',

          categories: [
            'business',
            'productivity',
          ],

          icons: [
            {
              src:
                '/pwa-192x192.png',
              sizes:
                '192x192',
              type:
                'image/png',
              purpose:
                'any',
            },
            {
              src:
                '/pwa-512x512.png',
              sizes:
                '512x512',
              type:
                'image/png',
              purpose:
                'any',
            },
            {
              src:
                '/pwa-maskable-512x512.png',
              sizes:
                '512x512',
              type:
                'image/png',
              purpose:
                'maskable',
            },
          ],
        },

        workbox: {
          navigateFallback:
            '/index.html',

          cleanupOutdatedCaches:
            true,

          clientsClaim:
            true,

          skipWaiting:
            true,

          runtimeCaching: [
            {
              urlPattern:
                /\\/api\\/routes$/,

              handler:
                'NetworkFirst',

              options: {
                cacheName:
                  'spt-route-cache',

                networkTimeoutSeconds:
                  10,

                expiration: {
                  maxEntries:
                    10,

                  maxAgeSeconds:
                    3600,
                },

                cacheableResponse: {
                  statuses:
                    [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(
          __dirname,
          '.'
        ),
      },
    },

    server: {
      hmr:
        process.env.DISABLE_HMR !==
        'true',

      watch:
        process.env.DISABLE_HMR ===
        'true'
          ? null
          : {},
    },
  };
});
