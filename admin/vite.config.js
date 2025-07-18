import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // hoặc port bạn muốn sử dụng
  },
  // Đảm bảo tất cả biến môi trường VITE_ được hiển thị cho client
  define: {
    __APP_ENV__: process.env.VITE_APP_ENV,
  }
})