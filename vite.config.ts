import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_APP_BASE?.replace(/^\/|\/$/g, '') || ''
  const base = mode === 'production' && basePath ? `/${basePath}/` : '/'

  return {
    plugins: [react()],
    base,
  }
})
