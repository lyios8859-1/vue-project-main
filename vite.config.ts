// @ts-ignore
import vueJsx from '@vitejs/plugin-vue-jsx';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vueJsx(), vue()],
  server: {
    port: 8081,
    host: '127.0.0.1' // fix: 控制台报： user --host to expose
  }
})