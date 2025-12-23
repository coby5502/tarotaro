import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // 1MB로 경고 임계값 상향
    rollupOptions: {
      output: {
        manualChunks: {
          // 큰 라이브러리를 별도 청크로 분리
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation': ['framer-motion'],
          'canvas': ['html2canvas'],
        },
      },
    },
  },
})
