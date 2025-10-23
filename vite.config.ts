import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

const repositoryName = 'ComputerGraphicsLab'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  
  base: 'ComputerGraphicsLab/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'pages/start-page.html')
      }
    }
  },
  server: {
    open: '/pages/start-page.html'
  }
})