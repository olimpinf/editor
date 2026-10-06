import { defineConfig, Plugin } from 'vite';
import { readFileSync } from 'fs';

// Single source of truth for the version shown in the status bar (see
// editor.ts) -- read from package.json instead of duplicating it, so a
// version bump there is the only edit needed to keep it in sync.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

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

// browsercc's clang.js/lld.js/index.js each contain a literal
// `new URL("clang.wasm"|"lld.wasm"|"sysroot.tar"|"stdc++.h.pch", import.meta.url)`
// which Vite's asset scanner statically detects and bundles into dist/assets/
// (~114MB) — even though local-cpp.ts always overrides locateFile on both
// Clang()/LLD() calls and never calls compile()/getPrecompiledHeader(), so
// these emitted copies are never actually fetched at runtime. Rewriting the
// literal into an equivalent non-literal expression (same runtime string,
// same behavior if the dead code path were ever hit) keeps Vite's scanner
// from recognizing it as an asset reference at all.
const BROWSERCC_ASSET_URL = /new URL\((\s*)"((?:clang|lld|sysroot|stdc\+\+\.h)\.[a-z+]+)"(\s*),\s*import\.meta\.url\)/g;
function stripBrowserccAssetUrls(code: string): string {
  return code.replace(BROWSERCC_ASSET_URL, (_m, ws1, filename, ws2) => `new URL(${ws1}("${filename}"+"")${ws2}, import.meta.url)`);
}
const browserccNoAssetScan: Plugin = {
  name: 'browsercc-no-asset-scan',
  enforce: 'pre', // must run before Vite's own asset-import-meta-url scanner sees the literal
  transform(code, id) {
    if (id.includes('node_modules/browsercc/dist')) {
      return { code: stripBrowserccAssetUrls(code), map: null };
    }
  },
};

export default defineConfig({
  //base: '/static/editor/',
  base: '/editor/',

  plugins: [blocklyNoAMD, browserccNoAssetScan],

  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

  // local-run-worker.ts (see src/local-run-client.ts) has its own
  // multi-module dependency graph (browsercc, pyodide, the WASI shim), which
  // needs code-splitting — Vite's default IIFE worker format doesn't support
  // that (same fix stress_test's vite.config.ts already needed).
  //
  // The worker bundle is built via a SEPARATE Rollup pass from the main
  // build, so plugins meant to apply to worker-graph modules (like
  // browserccNoAssetScan, since browsercc is only ever imported from
  // local-run-worker.ts, not from the main bundle) must be listed here too —
  // the top-level `plugins` array above is not automatically shared with it
  // (confirmed: without this, the transform hook never fired for anything
  // in the worker's module graph).
  worker: {
    format: 'es',
    plugins: () => [browserccNoAssetScan],
  },

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
        {
          name: 'browsercc-no-asset-scan',
          setup(build) {
            build.onLoad({ filter: /browsercc[\/\\]dist[\/\\](clang|lld|index)\.js$/ }, (args) => {
              const contents = stripBrowserccAssetUrls(readFileSync(args.path, 'utf8'));
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
