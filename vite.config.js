import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Если ты не используешь Vue, просто удали строку с плагином и его импорт

export default defineConfig({
  plugins: [vue()],
  base: '/', // для локальной разработки
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    open: true,
  },
})