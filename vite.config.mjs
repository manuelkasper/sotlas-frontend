import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';
import eslint from 'vite-plugin-eslint'
import { execSync } from 'child_process';
import { createRequire } from 'module';

const COMMITHASH = JSON.stringify(execSync('git rev-parse HEAD').toString().trim());

// FontAwesome Pro icons are optional (see README.md "FontAwesome Pro"): when
// NPM_FONTAWESOME_TOKEN isn't set, postinstall skips the pro packages and we
// alias their imports to the free-icon fallback in src/fa-pro-fallback/.
const require = createRequire(import.meta.url);

const fontAwesomeProAvailable = () => {
  try {
    require.resolve('@fortawesome/pro-regular-svg-icons/package.json');
    require.resolve('@fortawesome/pro-solid-svg-icons/package.json');
    return true;
  } catch {
    return false;
  }
};

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
  const useProIcons = fontAwesomeProAvailable();
  console.log(useProIcons
    ? '✨ FontAwesome Pro packages found — using Pro icons'
    : '✨ FontAwesome Pro packages not found — using free icon fallback (see README.md)');

  return {
    base,
    plugins: [
      vue(),
      eslint(),
      ...customPlugins
    ],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, 'src') },
        // vuedraggable's UMD build calls require('vue'). Vue's CJS entry is
        // the full build (vue/dist/vue.cjs.prod.js), which pulls in the
        // template compiler. Every template here is compiled from an SFC, so
        // the bare specifier resolves to the runtime-only build. Exact match
        // so vue/compiler-sfc, used by @vitejs/plugin-vue, is left alone.
        {
          find: /^vue$/,
          replacement: path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm-bundler.js')
        },
        ...(useProIcons ? [] : [
          {
            find: '@fortawesome/pro-regular-svg-icons',
            replacement: path.resolve(__dirname, 'src/fa-pro-fallback/regular.js')
          },
          {
            find: '@fortawesome/pro-solid-svg-icons',
            replacement: path.resolve(__dirname, 'src/fa-pro-fallback/solid.js')
          }
        ])
      ],
    },
    optimizeDeps: {
      include: [
        '@maptiler/sdk'
      ]
    },
    define: {
      COMMITHASH,
    },
  }
});