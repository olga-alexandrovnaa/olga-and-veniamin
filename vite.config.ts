import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Относительный base — скрипты и стили грузятся от текущего пути (работает на GitHub Pages)
  base: mode === 'production' ? './' : '/',
}))
