import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { reticle } from '@reticlehq/vite-plugin';
import fs from 'fs';
import path from 'path';
import os from 'os';

let reticleToken;
try {
  reticleToken = fs.readFileSync(path.join(os.homedir(), '.reticle', 'pairing-token'), 'utf8').trim();
} catch (e) {}

// https://vite.dev/config/
export default defineConfig({
  plugins: [reticle({ token: reticleToken }),react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '^/s/': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => '/api/share' + path.slice(2),
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
