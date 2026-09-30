import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Expose Supabase public config (anon/publishable keys are designed to be public).
  // Secret keys (SERVICE_ROLE, POSTGRES_*, JWT) are never prefixed NEXT_PUBLIC_ and
  // are never read in client code.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
});
