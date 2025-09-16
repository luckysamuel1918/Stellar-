import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Create a process.env object that includes all variables from the .env file
  // by spreading them. This is more robust than manually listing each one.
  // We also explicitly map VITE_GEMINI_API_KEY to API_KEY for the GenAI SDK.
  const processEnv = {
    ...env,
    API_KEY: env.VITE_GEMINI_API_KEY,
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './'),
      },
    },
    // The 'define' option will perform a literal replacement of `process.env`
    // with a JSON representation of the `processEnv` object. This makes
    // the `process.env.VAR_NAME` syntax work correctly in the browser.
    define: {
      'process.env': processEnv,
    },
    build: {
      outDir: 'dist',
    },
  };
});
