import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/pathfinder/").
// Locally it stays "/" so `npm run dev` works normally.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
})
