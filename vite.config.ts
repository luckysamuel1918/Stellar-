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
    // IMPORTANT SECURITY WARNING: API Key has been hardcoded.
    // This is not recommended for production environments.
    // Please replace "YOUR_GEMINI_API_KEY" with your actual key.
    define: {
      'process.env.API_KEY': JSON.stringify("YOUR_GEMINI_API_KEY"),
    },
    build: {
      outDir: 'dist',
    },
});