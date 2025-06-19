import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Changed from '/pickleball-rules-guru/' to '/' for Vercel
  define: {
    // Map process.env to import.meta.env for compatibility
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY || ''),
    'process.env.GOOGLE_CLOUD_PROJECT_ID': JSON.stringify(process.env.VITE_GOOGLE_CLOUD_PROJECT_ID || '')
  }
})
