import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // A page of growthgoal.in: everything is served under /learn.
  base: '/learn/',
  plugins: [react()],
  server: { proxy: { '/learn/api': 'http://localhost:4300' } },
})
