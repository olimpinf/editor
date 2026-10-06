// Compiles and runs student C/C++ code entirely client-side via browsercc
// (Clang/LLD compiled to WebAssembly, LLVM 20 — real C++20 support), for the
// "Executar" local-run path. Runs inside local-run-worker.ts (a dedicated
// Worker, so a runaway/infinite-loop program can be forcibly stopped via
// Worker.terminate() — impossible to interrupt from the main thread once a
// synchronous WASM loop is running there).
//
// browsercc's own `compile()`/`getCompilerInvocation()` wrappers are NOT
// used here: both hardcode fetching their .wasm/.tar assets relative to
// `import.meta.url` (i.e. wherever the bundled JS itself is served from),
// with no override. That's fine for browsercc's own demo, but wrong for us —
// inside ExamLock we specifically want these fetched from the bundled
// 'examlock-assets://' protocol, not the network. `Clang`/`LLD`/`setUpSysroot`
// are exported separately for exactly this kind of reuse (confirmed: neither
// hardcodes a URL), so this reimplements the ~50 lines of glue `compile()`
// and `getCompilerInvocation()` do internally, passing our own `locateFile`
// through to both. baseUrl is passed in explicitly (rather than resolved via
// getToolchainBaseUrl() here) since this module runs inside a Worker, which
// has no `window`.
import { Clang, LLD, setUpSysroot } from 'browsercc';
import { WASI, File, OpenFile, ConsoleStdout } from '@bjorn3/browser_wasi_shim';
import { appendCapped } from './local-run-config';

export interface LocalRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export interface CompileResult {
  ok: boolean;
  module: WebAssembly.Module | null;
  compileOutput: string;
}

// -fno-exceptions is mandatory: WASI-target C++ has no working exception
// runtime, even for code with no explicit try/catch (confirmed: plain
// vector/map/sort fails to *link* without it). User-confirmed acceptable
// for OBI's use case.
const CPP_FLAGS = ['-O2', '-std=c++20', '-fno-exceptions'];

// A fresh Clang()/LLD() instance is required for *every* compile — confirmed
// by hands-on testing that reusing one instance across multiple callMain()
// invocations corrupts its internal Emscripten runtime state (manifests as
// a "function signature mismatch" WASM trap on the second distinct compile,
// not merely stale output). What *is* safe and worth caching is the
// underlying clang.wasm/lld.wasm bytes themselves — wrapping the worker's
// global fetch() to cache them in memory means every later Clang()/LLD()
// call still creates a fresh instance (correct) but skips the slow
// disk read through the examlock-assets protocol handler (fast) — confirmed
// this is what was actually making cold *and* every-subsequent compile
// blow past the 5s run timeout, not just a one-time cold-start cost.
const fetchByteCache = new Map<string, Promise<ArrayBuffer>>();
const realFetch = self.fetch.bind(self);
(self as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : (input as any).url ?? String(input);
  if (/\/(clang|lld)\.wasm$/.test(url)) {
    if (!fetchByteCache.has(url)) {
      fetchByteCache.set(url, realFetch(url, init).then((r) => r.arrayBuffer()));
    }
    const bytes = await fetchByteCache.get(url)!;
    return new Response(bytes, { headers: { 'content-type': 'application/wasm' } });
  }
  return realFetch(input as any, init);
};

function locateFileFor(baseUrl: string) {
  return (path: string) => `${baseUrl}${path}`;
}

// sysroot.tar is a plain ArrayBuffer (not a live Emscripten instance), so
// unlike Clang/LLD it's simply safe to fetch once and reuse freely.
let sysrootPromise: Promise<ArrayBuffer> | null = null;
function getSysroot(baseUrl: string): Promise<ArrayBuffer> {
  if (!sysrootPromise) {
    sysrootPromise = fetch(`${baseUrl}sysroot.tar`).then((r) => r.arrayBuffer());
  }
  return sysrootPromise;
}

// Pre-reads the C++ toolchain's bundled assets (~114MB: clang.wasm +
// lld.wasm + sysroot.tar + stdc++.h.pch) through the examlock-assets
// protocol handler's disk read, so that cost is paid in the background
// while the student is still reading the problem statement rather than
// during their first "Executar" click. On Windows this read has been
// observed to take far longer than on macOS — almost certainly Windows
// Defender's real-time scan of these freshly-extracted-from-installer
// binaries on first access — long enough in practice to blow past the
// run timeout and get misreported as an infinite loop (see
// LOCAL_STARTUP_TIMEOUT_MS in local-run-client.ts for the other half of
// this fix). Safe to call redundantly: clang.wasm/lld.wasm/sysroot.tar
// reuse the same caches compileCpp() itself reads from, so a real compile
// started before this finishes just awaits the same in-flight fetches.
// stdc++.h.pch has no JS-side cache (only clang/lld .wasm bytes are
// intercepted above), but fetching it here still forces the one-time
// disk-read/AV-scan cost to happen now instead of during a timed run.
export async function warmUpCppAssets(baseUrl: string): Promise<void> {
  await Promise.all([
    fetch(`${baseUrl}clang.wasm`),
    fetch(`${baseUrl}lld.wasm`),
    fetch(`${baseUrl}stdc++.h.pch`),
    getSysroot(baseUrl),
  ]);
}

// Unlike the wasm bytes, the compiler invocation (cc1/linker argv) is NOT
// safe to cache and reuse across calls — confirmed by hands-on testing: a
// second compile reusing a first compile's cached argv failed with clang
// driver errors ("unknown argument '-vectorize-loops'", "no such file:
// 'clang++'"), even though the args are plain strings with no obvious
// instance-specific state. Not fully understood why, but reproducible, so
// this is recomputed fresh via its own disposable Clang instance every
// call — cheap now that the underlying clang.wasm bytes are cached (see
// above), so this is not a return to the original slow behavior.
async function getCompilerInvocation(baseUrl: string, inputName: string, flags: string[]): Promise<{
  compilerArgs: string[]; compilerArtifact: string; linkerArgs: string[]; linkerArtifact: string;
}> {
  let stderr = '';
  const clang = await Clang({
    thisProgram: 'clang++',
    locateFile: locateFileFor(baseUrl),
    printErr: (data: string) => { stderr += data + '\n'; },
  });
  clang.FS.writeFile(inputName, '');
  clang.FS.mkdirTree('/lib/wasm32-wasi');
  clang.FS.mkdirTree('/include/c++/v1');
  clang.FS.writeFile('/lib/wasm32-wasi/crt1-command.o', new Uint8Array(0));
  clang.FS.writeFile('/lib/wasm32-wasi/crt1-reactor.o', new Uint8Array(0));
  const ret = clang.callMain([inputName, ...flags, '-###']);
  if (ret !== 0) {
    throw new Error(`Clang driver failed with code ${ret}:\n${stderr}`);
  }
  const lines = stderr.split('\n');
  const getArgs = (key: string) => {
    const line = lines.find((l) => l.includes(key)) ?? '';
    const args = (line.match(/"([^"]*)"/g) ?? []).map((s) => s.slice(1, -1)).slice(1);
    const oIndex = args.findIndex((arg) => arg === '-o');
    return { args, outputFileName: args[oIndex + 1] };
  };
  const cc1line = getArgs('-cc1');
  const linkerLine = getArgs('wasm-ld');
  return {
    compilerArgs: cc1line.args,
    compilerArtifact: cc1line.outputFileName,
    linkerArgs: linkerLine.args,
    linkerArtifact: linkerLine.outputFileName,
  };
}

/** Compiles one C++ source file to a runnable WebAssembly module. */
export async function compileCpp(source: string, baseUrl: string, fileName = 'main.cpp'): Promise<CompileResult> {
  let stderr = '';
  const onErr = (data: string) => { stderr += data + '\n'; };

  // Fresh instances every call (see comment above the fetch cache) — the
  // wasm bytes themselves are cached, so this is fast after the first call.
  const clangPromise = Clang({ thisProgram: 'clang++', locateFile: locateFileFor(baseUrl), printErr: onErr });
  const lldPromise = LLD({ thisProgram: 'wasm-ld', locateFile: locateFileFor(baseUrl), printErr: onErr });
  const sysrootReady = getSysroot(baseUrl);

  let invocation;
  try {
    invocation = await getCompilerInvocation(baseUrl, fileName, CPP_FLAGS);
  } catch (e: any) {
    return { ok: false, module: null, compileOutput: e?.message || String(e) };
  }

  const [clang, lld, sysroot] = await Promise.all([clangPromise, lldPromise, sysrootReady]);

  clang.FS.writeFile(fileName, source);
  setUpSysroot(clang, sysroot);
  let exitCode = clang.callMain(invocation.compilerArgs);
  if (exitCode !== 0) {
    return { ok: false, module: null, compileOutput: stderr };
  }

  const objectBytes = clang.FS.readFile(invocation.compilerArtifact, { encoding: 'binary' });
  lld.FS.writeFile(invocation.compilerArtifact, objectBytes);
  setUpSysroot(lld, sysroot);
  exitCode = lld.callMain(invocation.linkerArgs);
  if (exitCode !== 0) {
    return { ok: false, module: null, compileOutput: stderr };
  }

  const linkedBytes = lld.FS.readFile(invocation.linkerArtifact, { encoding: 'binary' });
  const module = await WebAssembly.compile(linkedBytes.buffer as ArrayBuffer);
  return { ok: true, module, compileOutput: stderr };
}

/**
 * Runs a previously-compiled module with the given stdin, capturing
 * stdout/stderr. onChunk (if given) is invoked as each line is produced —
 * used to stream partial output back to the main thread so a forcibly
 * stopped/timed-out run (Worker.terminate() gives no chance for a final
 * message) can still show whatever the program printed before it was killed.
 */
export async function runCppLocally(
  module: WebAssembly.Module,
  stdin: string,
  onChunk?: (stream: 'stdout' | 'stderr', chunk: string) => void,
): Promise<LocalRunResult> {
  let stdout = '';
  let stderr = '';

  const fds = [
    new OpenFile(new File(new TextEncoder().encode(stdin))), // fd 0: stdin
    ConsoleStdout.lineBuffered((line: string) => { stdout = appendCapped(stdout, line + '\n'); onChunk?.('stdout', line + '\n'); }), // fd 1: stdout
    ConsoleStdout.lineBuffered((line: string) => { stderr = appendCapped(stderr, line + '\n'); onChunk?.('stderr', line + '\n'); }), // fd 2: stderr
  ];
  const wasi = new WASI([], [], fds);

  let exitCode: number | null = 0;
  try {
    const instance = await WebAssembly.instantiate(module, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
    exitCode = wasi.start(instance as any);
  } catch (e: any) {
    // WASIProcExit carries the program's real exit code, thrown by the
    // shim's own proc_exit implementation.
    if (e?.code !== undefined) {
      exitCode = e.code;
    } else {
      exitCode = -1;
      stderr += (stderr && !stderr.endsWith('\n') ? '\n' : '') + (e?.message || String(e));
    }
  }

  return { stdout, stderr, exitCode };
}
