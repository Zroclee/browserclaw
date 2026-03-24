import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'child_process';

// https://vite.dev/config/
export default defineConfig({
  base: '/web/',
  plugins: [
    vue(), 
    tailwindcss(),
    {
      name: 'copy-dist-to-gateway',
      closeBundle() {
        console.log('Copying dist to gateway static folder...');
        execSync('rm -rf ../gateway/src/static && cp -R dist ../gateway/src/static', { stdio: 'inherit' });
      },
    },
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:18302',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
