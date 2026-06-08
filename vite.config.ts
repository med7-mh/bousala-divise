import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['app-icon.svg'],
        manifest: {
          name: 'صراف بلس',
          short_name: 'صراف بلس',
          id: '/',
          start_url: '/',
          description: 'تطبيق إدارة الصرافة وتبديل العملات',
          theme_color: '#194f41',
          background_color: '#f8fafc',
          display: 'standalone',
          icons: [
            {
              src: 'app-icon.svg',
              sizes: '48x48 72x72 96x96 128x128 144x144 192x192 256x256 384x384 512x512',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: 'app-icon.svg',
              sizes: '48x48 72x72 96x96 128x128 144x144 192x192 256x256 384x384 512x512',
              type: 'image/svg+xml',
              purpose: 'maskable'
            }
          ]
        },
        devOptions: {
          enabled: true
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
