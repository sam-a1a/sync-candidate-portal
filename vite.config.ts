import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  /*
   * GitHub Pages serves a project site from /<repo>/, so every built URL has
   * to carry that prefix — BASE_PATH is set by the deploy. Anything fetched at
   * runtime out of public/ reads import.meta.env.BASE_URL rather than starting
   * with a slash, or it would look for the file at the domain root.
   */
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
