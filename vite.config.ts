import { defineConfig, Plugin } from 'vite';
import { readFileSync } from 'fs';

const AMD_GUARD = /typeof define\s*===?\s*['"]function['"]\s*&&\s*define\.amd/g;

// Blockly's _compressed.js files are UMD bundles that detect Monaco's global
// window.define (AMD loader) and try to register via it, causing a conflict.
// This plugin replaces the AMD guard with `false` in both the Rollup build
// pass (transform hook) and the esbuild pre-bundling pass (esbuild plugin).
const blocklyNoAMD: Plugin = {
  name: 'blockly-no-amd',
  transform(code, id) {
    if (id.includes('node_modules/blockly') && id.includes('_compressed')) {
      return { code: code.replace(AMD_GUARD, 'false'), map: null };
    }
  },
};

export default defineConfig({
  //base: '/static/editor/',
  base: '/editor/',

  plugins: [blocklyNoAMD],

  resolve: {
    conditions: ['import', 'browser', 'module', 'default'],
  },

  optimizeDeps: {
    esbuildOptions: {
      conditions: ['import', 'browser', 'module', 'default'],
      plugins: [
        {
          name: 'blockly-no-amd',
          setup(build) {
            build.onLoad({ filter: /blockly.*_compressed\.js$/ }, (args) => {
              const contents = readFileSync(args.path, 'utf8').replace(AMD_GUARD, 'false');
              return { contents, loader: 'js' };
            });
          },
        },
      ],
    },
  },

  build: {
    target: 'ES2022',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    copyPublicDir: true
  },
  server: {
    port: 5173,
    open: true
  }
});
