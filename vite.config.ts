import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// FIX: Import 'process' to provide types for 'process.cwd()' and resolve build-time errors.
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // FIX: 'process' is globally available in Node.js. The explicit import was causing type conflicts.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // FIX: __dirname is not available in ES modules. Replaced with process.cwd() to correctly resolve the project root.
        '@': path.resolve(process.cwd(), './'),
      },
    },
    // Define is used to replace global variables at build time.
    // Vite's default import.meta.env was not working in the execution environment,
    // so we manually define process.env variables from the loaded .env file.
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
      'process.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
      'process.env.VITE_TEST_MESSAGE': JSON.stringify(env.VITE_TEST_MESSAGE),
    },
    build: {
      outDir: 'dist',
    },
  };
});