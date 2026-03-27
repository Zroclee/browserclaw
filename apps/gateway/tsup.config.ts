import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  bundle: true,
  env: {
    NODE_ENV: 'production',
  },
  noExternal: ['@zrocclaw/core'],
  external: [
    'cors', 
    'dotenv', 
    'express', 
    'helmet', 
    'http-proxy-middleware',
    'playwright',
    'langchain',
    '@langchain/core',
    '@langchain/openai',
    '@langchain/langgraph',
    'zod',
    'chromium-bidi',
    'node-schedule',
  ],
  onSuccess: 'mkdir -p ../cli/server && cp dist/server.js ../cli/server/server.js',
});