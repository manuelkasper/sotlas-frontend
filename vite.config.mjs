import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue2';
import fs from 'fs';
import path from 'path';
import eslint from 'vite-plugin-eslint'
import { execSync } from 'child_process';

const COMMITHASH = JSON.stringify(execSync('git rev-parse HEAD').toString().trim());

// Auto-load plugins from vite-plugins directory

const loadCustomPlugins = async () => {
  const pluginsDir = path.join(__dirname, 'vite-plugins');
  
  if (!fs.existsSync(pluginsDir)) return [];
  
  const pluginFiles = fs.readdirSync(pluginsDir)
    .filter(file => /\.(js|mjs)$/.test(file) && !file.startsWith('.'));
  
  const plugins = [];
  
  for (const pluginFile of pluginFiles) {
    try {
      const pluginModule = await import(path.join(pluginsDir, pluginFile));
      
      const filePlugins = Object.values(pluginModule)
        .filter(export_ => typeof export_ === 'function')
        .map(pluginFn => pluginFn())
        .filter(plugin => plugin?.name)
        .map(plugin => {
          console.log(`✨ Loaded Vite plugin: ${plugin.name} from ${pluginFile}`);
          return plugin;
        });
      
      plugins.push(...filePlugins);
    } catch (error) {
      console.warn(`⚠️  Failed to load plugin from ${pluginFile}:`, error.message);
    }
  }
  
  return plugins;
};

export default defineConfig(async ({ mode }) => {
  const customPlugins = await loadCustomPlugins();
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.PUBLIC_PATH || '/';

  return {
    base,
    plugins: [
      vue(),
      eslint(),
      ...customPlugins
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
    },
    optimizeDeps: {
      include: [
        'map-promisified',
        'events',
        'maplibre-gl'
      ]
    },
    define: {
      COMMITHASH,
    },
  }
});