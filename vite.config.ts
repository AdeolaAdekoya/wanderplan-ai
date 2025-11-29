import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env vars from .env files (empty prefix means load all)
    const env = loadEnv(mode, process.cwd(), '');
    // Check multiple sources: .env files, then process.env (for Vercel build-time)
    const rawApiKey = env.GEMINI_API_KEY || 
                      env.VITE_GEMINI_API_KEY || 
                      process.env.GEMINI_API_KEY || 
                      process.env.VITE_GEMINI_API_KEY;
    // Trim whitespace in case there's any
    const apiKey = rawApiKey ? String(rawApiKey).trim() : '';
    
    // Log for debugging (only first 10 chars to avoid exposing full key)
    if (apiKey) {
      console.log('✓ API key loaded:', apiKey.substring(0, 10) + '...', `(length: ${apiKey.length})`);
    } else {
      console.warn('⚠ API key not found in environment variables');
    }
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
