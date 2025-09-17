import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve('./'),
      },
    },
    define: {
      // Map Gemini API key if you want to expose it as process.env.API_KEY
      'process.env': {
        API_KEY: env.VITE_GEMINI_API_KEY, 
      },
    },
    build: {
      outDir: 'dist',
    },
  };
});
