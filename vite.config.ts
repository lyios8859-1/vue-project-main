// @ts-ignore
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vueJsx()],
  server: {
    port: 8081,
    host: '127.0.0.1' // fix: 控制台报： user --host to expose
  }
})