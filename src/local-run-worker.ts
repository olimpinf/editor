// Runs local C++/Python compilation and execution off the main thread, so a
// student's runaway program (e.g. an infinite loop) can be forcibly stopped
// via Worker.terminate() from local-run-client.ts — impossible to interrupt
// a synchronous WASM loop from the same thread it's running on.
import { compileCpp, runCppLocally, warmUpCppAssets, type CompileResult } from './local-cpp';
import { runPythonLocally, warmUpPythonAssets } from './local-python';

export type WorkerRequest =
  | { cmd: 'run-cpp'; reqId: number; tabId: string; source: string; stdin: string; baseUrl: string; maxMemoryBytes: number }
  | { cmd: 'run-python'; reqId: number; source: string; stdin: string; baseUrl: string }
  | { cmd: 'warmup'; reqId: number; cppBaseUrl: string; pythonBaseUrl: string };

export type WorkerResponse =
  | { cmd: 'run-cpp'; reqId: number; compileOk: boolean; compileOutput: string; stdout: string; stderr: string; exitCode: number | null }
  | { cmd: 'run-python'; reqId: number; stdout: string; stderr: string; exitCode: number | null }
  | { cmd: 'warmup'; reqId: number }
  // Signals that the slow, disk/AV-scan-bound part (reading the C++ toolchain
  // off disk / loading Pyodide) is done and the student's own code is about
  // to run — see LOCAL_STARTUP_TIMEOUT_MS vs LOCAL_RUN_TIMEOUT_MS in
  // local-run-client.ts.
  | { cmd: 'toolchain-ready'; reqId: number }
  | { cmd: 'output-chunk'; reqId: number; stream: 'stdout' | 'stderr'; chunk: string }
  | { cmd: 'error'; reqId: number; message: string };

// Skips recompiling C++ when neither the source nor the memory-limit
// setting has changed since the last successful compile for that tab.
// maxMemoryBytes is part of the cache key (not just source) because it's a
// link-time flag (see local-cpp.ts's compileCpp) -- a cached module from
// before the student changed the setting would silently keep the OLD
// limit. Lives here (not the client) so it survives across calls within
// one worker's lifetime — a stop/timeout terminates the worker, which
// naturally clears this too, matching the expected cost of forcibly
// killing a runaway compile/run.
const cppCompileCache = new Map<string, { source: string; maxMemoryBytes: number; result: CompileResult }>();

async function getCompiledCpp(tabId: string, source: string, baseUrl: string, maxMemoryBytes: number): Promise<CompileResult> {
  const cached = cppCompileCache.get(tabId);
  if (cached && cached.source === source && cached.maxMemoryBytes === maxMemoryBytes) return cached.result;
  const result = await compileCpp(source, baseUrl, 'main.cpp', maxMemoryBytes);
  cppCompileCache.set(tabId, { source, maxMemoryBytes, result });
  return result;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  const post = (msg: WorkerResponse) => (self as unknown as Worker).postMessage(msg);

  // Streams output as it's produced, not just at the end — Worker.terminate()
  // (used for the "Parar" button and the run timeout) gives no chance for a
  // final message, so this is the only way a forcibly-stopped run can still
  // show whatever it printed before being killed.
  //
  // Capped at a fixed number of messages: a tight loop with no delay (e.g.
  // `while(1) cout << x;`) calls this on every single line, potentially
  // thousands of times per second. Confirmed by hands-on testing this is a
  // real, serious bug, not a theoretical one — without a cap, the flood of
  // postMessage calls (a) grows the main thread's receive-side buffer
  // without bound, OOM-crashing the renderer (the "blank grey window"), and
  // (b) queues so far behind the "Parar" button's own click handler that it
  // looks like Parar does nothing, when the click is just stuck waiting
  // behind the backlog. Once the cap is hit, later chunks are silently
  // dropped from the *stream* — the final/timeout/stop outcome still carries
  // the worker's own capped stdout/stderr (see appendCapped in
  // local-run-config.ts), this only bounds how much gets streamed live.
  const MAX_STREAMED_CHUNKS = 500;
  let streamedChunks = 0;
  const onChunk = (stream: 'stdout' | 'stderr', chunk: string) => {
    if (streamedChunks >= MAX_STREAMED_CHUNKS) return;
    streamedChunks++;
    post({ cmd: 'output-chunk', reqId: req.reqId, stream, chunk });
  };

  try {
    if (req.cmd === 'run-cpp') {
      const compileResult = await getCompiledCpp(req.tabId, req.source, req.baseUrl, req.maxMemoryBytes);
      // Everything slow and disk/AV-scan-bound (reading clang.wasm/lld.wasm/
      // sysroot.tar off disk, compiling, linking) is done by this point,
      // whether or not the student's source actually compiled — from here
      // on, a hang can only mean their own program is looping.
      post({ cmd: 'toolchain-ready', reqId: req.reqId });
      if (!compileResult.ok || !compileResult.module) {
        post({
          cmd: 'run-cpp', reqId: req.reqId,
          compileOk: false, compileOutput: compileResult.compileOutput,
          stdout: '', stderr: '', exitCode: null,
        });
        return;
      }
      const result = await runCppLocally(compileResult.module, req.stdin, onChunk);
      post({
        cmd: 'run-cpp', reqId: req.reqId,
        compileOk: true, compileOutput: compileResult.compileOutput,
        stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode,
      });
      return;
    }

    if (req.cmd === 'run-python') {
      const onReady = () => post({ cmd: 'toolchain-ready', reqId: req.reqId });
      const result = await runPythonLocally(req.source, req.stdin, req.baseUrl, onChunk, onReady);
      post({ cmd: 'run-python', reqId: req.reqId, stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode });
      return;
    }

    if (req.cmd === 'warmup') {
      await Promise.all([warmUpCppAssets(req.cppBaseUrl), warmUpPythonAssets(req.pythonBaseUrl)]);
      post({ cmd: 'warmup', reqId: req.reqId });
      return;
    }
  } catch (e: any) {
    post({ cmd: 'error', reqId: (req as any).reqId, message: e?.message || String(e) });
  }
};
