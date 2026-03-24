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
        console.log('Copying dist to cli server static folder...');
        execSync('rm -rf ../cli/server/static && cp -R dist ../cli/server/static', { stdio: 'inherit' });
      },
    },
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:18302',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
