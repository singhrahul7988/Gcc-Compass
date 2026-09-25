import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createAiApiPlugin } from './server/ai-api.mjs';

export default defineConfig({
  plugins: [react(), createAiApiPlugin()],
});

