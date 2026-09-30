import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Mirror the Vercel rewrite (vercel.json) so dev/preview can hit rates locally.
  server: {
    proxy: { '/api/rates': { target: 'https://lgm-express.vercel.app', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/rates/, '') } },
  },
  preview: {
    proxy: { '/api/rates': { target: 'https://lgm-express.vercel.app', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/rates/, '') } },
  },
  // Expose Supabase public config (anon/publishable keys are designed to be public).
  // Secret keys (SERVICE_ROLE, POSTGRES_*, JWT) are never prefixed NEXT_PUBLIC_ and
  // are never read in client code.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
});
