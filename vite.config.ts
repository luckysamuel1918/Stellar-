import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// FIX: Re-imported `process` from 'process' to provide the correct types for `process.cwd()` and resolve the build error.
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve('./'),
      },
    },
    // Google Gemini API Key is hardcoded here.
    // This is a security risk and not recommended for production.
    define: {
      'process.env.API_KEY': JSON.stringify("AIzaSyA_...Your...Fake...Gemini...Key...cDEf456"),
    },
    build: {
      outDir: 'dist',
    },
});