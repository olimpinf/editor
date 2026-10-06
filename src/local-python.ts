// Runs student Python code entirely client-side via Pyodide, for the
// "Executar" local-run path. Runs inside local-run-worker.ts (a dedicated
// Worker, so a runaway/infinite-loop program can be forcibly stopped via
// Worker.terminate()). Loaded lazily on first use, then cached for the
// worker's lifetime — loading the WASM interpreter (~13MB) takes real time
// and should only happen once, not per run. baseUrl is passed in explicitly
// (rather than resolved via getToolchainBaseUrl() here) since this module
// has no `window` — only `self`, shared by both the main thread and Workers.
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { appendCapped } from './local-run-config';

export interface LocalRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

let pyodidePromise: Promise<PyodideInterface> | null = null;

function getPyodide(baseUrl: string): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    // Electron's renderer process exposes a `process` global even in this
    // browser-like context, which makes Pyodide misdetect itself as running
    // under Node (and then fail trying to `import` fs/promises, vm, etc.).
    // Already guarded against upstream (see pyodide.mjs's IN_NODE check) —
    // this flag is the documented way to force browser-mode detection.
    const g = self as any;
    if (typeof g.process === 'object') g.process.browser = true;

    pyodidePromise = loadPyodide({ indexURL: baseUrl });
  }
  return pyodidePromise;
}

// Pre-loads Pyodide (~13MB) in the background so that cost is already paid
// by the student's first "Executar" click — same rationale as
// warmUpCppAssets in local-cpp.ts, just for the much smaller Python
// toolchain. Reuses the same pyodidePromise cache a real run would.
export async function warmUpPythonAssets(baseUrl: string): Promise<void> {
  await getPyodide(baseUrl);
}

// onChunk (if given) is invoked as each line is produced — used to stream
// partial output back to the main thread so a forcibly stopped/timed-out run
// (Worker.terminate() gives no chance for a final message) can still show
// whatever the program printed before it was killed.
export async function runPythonLocally(
  source: string,
  stdin: string,
  baseUrl: string,
  onChunk?: (stream: 'stdout' | 'stderr', chunk: string) => void,
  // Called once Pyodide has finished loading (the slow, disk/AV-scan-bound
  // part on a cold worker) and the student's actual script is about to run —
  // see local-run-worker.ts's 'toolchain-ready' message and
  // LOCAL_STARTUP_TIMEOUT_MS in local-run-client.ts.
  onReady?: () => void,
): Promise<LocalRunResult> {
  const pyodide = await getPyodide(baseUrl);
  onReady?.();

  let stdout = '';
  let stderr = '';

  const stdinLines = stdin.length > 0 ? stdin.split('\n') : [];
  let stdinPos = 0;
  pyodide.setStdin({
    stdin: () => (stdinPos < stdinLines.length ? stdinLines[stdinPos++] : null),
  });
  pyodide.setStdout({ batched: (s: string) => { stdout = appendCapped(stdout, s + '\n'); onChunk?.('stdout', s + '\n'); } });
  pyodide.setStderr({ batched: (s: string) => { stderr = appendCapped(stderr, s + '\n'); onChunk?.('stderr', s + '\n'); } });

  let exitCode: number | null = 0;
  // A fresh globals dict per run — otherwise variables/functions/imports
  // from a previous run silently leak into the next one (confirmed by
  // hands-on testing: without this, editing out a bug and re-running can
  // still "work" off a stale variable from the prior run).
  const freshGlobals = pyodide.globals.get('dict')();
  try {
    await pyodide.runPythonAsync(source, { globals: freshGlobals });
  } catch (e: any) {
    exitCode = 1;
    const message = e?.message || String(e);
    stderr += (stderr && !stderr.endsWith('\n') ? '\n' : '') + message;
  } finally {
    freshGlobals.destroy();
    // Reset stdin/stdout/stderr handlers so a leftover reference from this
    // run's closures doesn't linger for the next one.
    pyodide.setStdin({});
    pyodide.setStdout({});
    pyodide.setStderr({});
  }

  return { stdout, stderr, exitCode };
}
