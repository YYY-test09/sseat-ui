import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置：开发代理，让前端请求直接转发给 8080 端口的 Spring Boot
// 这样浏览器访问的都是 localhost:5173，天然同源，不会遇到 CORS 跨域问题
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // 所有 /api 开头的请求转发给后端
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      // 上传的图片也走后端静态资源映射
      '/uploads': { target: 'http://localhost:8080', changeOrigin: true }
    }
  }
})
