// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'https://kairos-api.duckdns.org',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
});
