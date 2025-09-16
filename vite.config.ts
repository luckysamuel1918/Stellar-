import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// FIX: Import 'process' to provide type definitions and functionality for process.cwd().
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // FIX: process.cwd() requires the 'process' module to be imported for type safety.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // FIX: __dirname is not available in ES modules. Replaced with process.cwd() to correctly resolve the project root.
        '@': path.resolve(process.cwd(), './'),
      },
    },
    define: {
      // Expose the Gemini API key to the app, which expects it on process.env
      // Make sure to set VITE_GEMINI_API_KEY in your Vercel environment variables
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    build: {
      outDir: 'dist',
    },
  };
});
