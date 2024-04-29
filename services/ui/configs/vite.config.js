import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import path from 'path';
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  envDir: path.resolve(__dirname, '../envs'),
  envPrefix: 'VUE_APP_',
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    // @quasar/plugin-vite options list:
    // https://github.com/quasarframework/quasar/blob/dev/vite-plugin/index.d.ts
    quasar({
      sassVariables: '../src/styles/quasar.variables.sass'
    }),
    svgLoader()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  }
});
