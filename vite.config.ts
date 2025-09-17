import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// FIX: Re-imported `process` from 'process' to provide the correct types for `process.cwd()` and resolve the build error.
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for use in this config file
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve('./'),
      },
    },
    // FIX: Simplified the `define` block. Firebase now uses Vite's standard `import.meta.env`.
    // We only need to define `process.env.API_KEY` for the GenAI SDK.
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    build: {
      outDir: 'dist',
    },
  };
});