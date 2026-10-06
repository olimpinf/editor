// Resolves where the local WASM compiler/interpreter toolchains (C/C++ via
// browsercc, Python via Pyodide) should be fetched from.
//
// Inside ExamLock, exam-app's renderer.js injects window.EXAMLOCK_WASM_BASE_URL
// ('examlock-assets://') once the editor webview has loaded — see
// exam-app-branch-version2.0/renderer.js. The bundled toolchains are then
// served by main.js's 'examlock-assets://' protocol handler with no
// exam-day network dependency.
//
// Standalone (npm run dev, or the editor reused outside ExamLock), that
// global is never set, so this falls back to the same self-hosted CDN
// convention used for Monaco/fonts (see scripts/fetch-cdn.sh).
export type ToolchainName = 'cpp' | 'python';

export function getToolchainBaseUrl(toolchain: ToolchainName): string {
  const examlockBase = (window as any).EXAMLOCK_WASM_BASE_URL as string | undefined;
  if (examlockBase) {
    return `${examlockBase}${toolchain}/`;
  }
  return `/editor/cdn/wasm-toolchains/${toolchain}/`;
}

// Guard against a runaway loop that prints continuously (e.g. `while (true)
// cout << "x";`) — bounded by the run timeout, but a tight loop can still
// produce megabytes of output in a few seconds, which would choke string
// concatenation and DOM rendering. Used by both local-cpp.ts and
// local-python.ts's output collectors.
export const MAX_LOCAL_RUN_OUTPUT_CHARS = 200_000;

export function appendCapped(current: string, addition: string): string {
  if (current.length >= MAX_LOCAL_RUN_OUTPUT_CHARS) return current;
  const combined = current + addition;
  if (combined.length > MAX_LOCAL_RUN_OUTPUT_CHARS) {
    return combined.slice(0, MAX_LOCAL_RUN_OUTPUT_CHARS) + '\n[... saída truncada, limite de caracteres atingido ...]\n';
  }
  return combined;
}
