// @ts-ignore
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vueJsx(), vue()],
  resolve: {
    alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/components")
    }
},
  server: {
    port: 8081,
    host: '127.0.0.1', // fix: 控制台报： user --host to expose
    https: false, // 是否开启 https
    open: true, // 是否自动在浏览器打开
    hmr: {
        overlay: true, // 是否开启错误的阴影层
    }
  },
  build: {
    chunkSizeWarningLimit: 2000,
    terserOptions: {
        // 生产环境移除console
        compress: {
            drop_console: true,
            drop_debugger: true,
        },
    },
    rollupOptions: {
      output:{
          manualChunks: {
            vue: ['vue']
          }
      }
  }
  }
})