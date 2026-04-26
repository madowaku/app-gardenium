import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // GEMINI_API_KEY is intentionally NOT exposed to the client.
      // AI features must use server-side API endpoints.
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            const normalizedId = id.replace(/\\/g, '/');

            if (normalizedId.includes('/react-dom/') || normalizedId.includes('/react-router-dom/') || normalizedId.includes('/react/')) {
              return 'react-vendor';
            }

            if (normalizedId.includes('/firebase/') || normalizedId.includes('/@firebase/')) {
              return 'firebase-vendor';
            }

            if (normalizedId.includes('/lucide-react/')) {
              return 'icon-vendor';
            }

            if (normalizedId.includes('/motion/')) {
              return 'motion-vendor';
            }

            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
