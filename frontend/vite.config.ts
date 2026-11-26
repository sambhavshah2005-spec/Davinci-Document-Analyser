import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      '/ask': 'http://localhost:5000',
      '/sessions': 'http://localhost:5000',
      '/analyzer': 'http://localhost:5000',
      '/research': 'http://localhost:5000',
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      }
    }
  }
})
