import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue2';
import path from 'path';
import { execSync } from 'child_process';

const COMMITHASH = JSON.stringify(execSync('git rev-parse HEAD').toString().trim());

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.PUBLIC_PATH || '/';

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'vue/dist/vue.esm': 'vue'
      },
    },
    optimizeDeps: {
      include: [
        'map-promisified'
      ]
    },
    define: {
      COMMITHASH,
    },
  }
});