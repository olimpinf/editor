// Main-thread client for local-run-worker.ts. Owns the Worker's lifecycle:
// creates it lazily, forcibly terminates it on stop/timeout (the only way to
// interrupt a synchronous WASM loop), and transparently creates a fresh one
// for the next run — which also means the C++ compile cache and the loaded
// Pyodide/Clang/LLD instances are lost on a stop/timeout, an accepted cost
// of forcibly killing a runaway program.
import type { WorkerRequest, WorkerResponse } from './local-run-worker';
import { appendCapped } from './local-run-config';

// Covers reading the C++ toolchain off disk (clang.wasm/lld.wasm/
// sysroot.tar/stdc++.h.pch, ~114MB) plus compiling+linking, or loading
// Pyodide (~13MB) — none of which has anything to do with whether the
// student's own code loops forever. Confirmed by hands-on testing on a
// Windows machine: this disk read alone can take far longer than on macOS
// — almost certainly Windows Defender's real-time scan of these large
// files on first access post-install, something macOS has no equivalent
// of for already-bundled app resources — long enough in practice to blow
// past the old single 8s timeout and get misreported to the student as
// "provável loop infinito" when their program never even started running.
// Generous on purpose: a slow toolchain load is a one-time (per worker
// lifetime) cost, not something a student can fix by editing their code,
// so there's no reason to race it against the same clock as an actual
// infinite loop. warmUpLocalRun() (below) pays this cost in the
// background ahead of time so students rarely hit this path at all.
export const LOCAL_STARTUP_TIMEOUT_MS = 30_000;

export interface LocalRunOutcome {
  ok: boolean;
  stopped?: boolean;
  timedOut?: boolean;
  errorMessage?: string;
  compileOk?: boolean;
  compileOutput?: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

// Accumulates output-chunk messages as they stream in, so a stop/timeout
// (Worker.terminate() gives no chance for a final message) can still report
// whatever the program printed before it was killed — not just the
// stop/timeout notice with no output, which is what a naive "resolve empty
// on kill" would show. `timer` holds whichever of the two timeouts
// (startup/run) is currently armed for this request — swapped out when a
// 'toolchain-ready' message arrives, see ensureWorker()'s onmessage below.
type PendingEntry = { resolve: (r: LocalRunOutcome) => void; stdout: string; stderr: string; timer: ReturnType<typeof setTimeout>; runTimeoutMs: number };

let worker: Worker | null = null;
let nextReqId = 0;
const pending = new Map<number, PendingEntry>();

function killWorker(reason: 'stopped' | 'timedOut'): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
    entry.resolve({ ok: false, [reason]: true, stdout: entry.stdout, stderr: entry.stderr, exitCode: null } as LocalRunOutcome);
  }
  pending.clear();
}

function armTimeout(reqId: number, ms: number): ReturnType<typeof setTimeout> {
  return setTimeout(() => {
    if (!pending.has(reqId)) return; // already resolved
    killWorker('timedOut');
  }, ms);
}

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./local-run-worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const data = event.data;
    const entry = pending.get(data.reqId);
    if (!entry) return;

    if (data.cmd === 'output-chunk') {
      // Defense in depth alongside the worker's own MAX_STREAMED_CHUNKS cap
      // (local-run-worker.ts) — bounds this accumulator's size directly,
      // regardless of message count or individual chunk size.
      if (data.stream === 'stdout') entry.stdout = appendCapped(entry.stdout, data.chunk);
      else entry.stderr = appendCapped(entry.stderr, data.chunk);
      return; // not a final message — keep waiting
    }

    if (data.cmd === 'toolchain-ready') {
      // The slow, disk/AV-scan-bound part is done — from here on, a hang can
      // only mean the student's own code is looping, so switch from the
      // generous startup allowance to the short infinite-loop guard (the
      // student's own configured limit, see local-run-settings.ts — set
      // when this request was sent, not re-read live, so it can't change
      // mid-run out from under an in-flight request).
      clearTimeout(entry.timer);
      entry.timer = armTimeout(data.reqId, entry.runTimeoutMs);
      return; // not a final message — keep waiting
    }

    if (data.cmd === 'warmup') return; // warmUpLocalRun() never registers a pending entry; unreachable in practice

    clearTimeout(entry.timer);
    pending.delete(data.reqId);
    if (data.cmd === 'error') {
      entry.resolve({ ok: false, errorMessage: data.message, stdout: entry.stdout, stderr: entry.stderr, exitCode: null });
    } else if (data.cmd === 'run-cpp') {
      entry.resolve({ ok: true, compileOk: data.compileOk, compileOutput: data.compileOutput, stdout: data.stdout, stderr: data.stderr, exitCode: data.exitCode });
    } else {
      entry.resolve({ ok: true, stdout: data.stdout, stderr: data.stderr, exitCode: data.exitCode });
    }
  };
  worker.onerror = (event: ErrorEvent) => {
    event.preventDefault();
    console.error('[local-run-client] worker error:', event.message || 'Erro desconhecido no worker de execução local.');
    killWorker('stopped');
  };
  return worker;
}

/** Forcibly stops any in-flight local run — the "Parar" button. */
export function stopLocalRun(): void {
  killWorker('stopped');
}

async function sendRequest(req: Omit<WorkerRequest, 'reqId'>, runTimeoutMs: number): Promise<LocalRunOutcome> {
  const w = ensureWorker();
  const reqId = nextReqId++;

  // Starts under the generous startup allowance — swapped for the
  // caller-supplied run-only timeout once the worker reports
  // 'toolchain-ready' (see ensureWorker()'s onmessage above).
  const resultPromise = new Promise<LocalRunOutcome>((resolve) => {
    pending.set(reqId, { resolve, stdout: '', stderr: '', timer: armTimeout(reqId, LOCAL_STARTUP_TIMEOUT_MS), runTimeoutMs });
  });

  w.postMessage({ ...req, reqId } as WorkerRequest);

  return resultPromise;
}

/**
 * Fire-and-forget: pre-reads both toolchains' bundled assets off disk in the
 * background (see warmUpCppAssets/warmUpPythonAssets), so the one-time
 * disk-read/AV-scan cost is already paid by the time the student clicks
 * "Executar" for the first time. Call once the exam is actually unlocked
 * (see wireRunButtons() in editor.ts) — no point warming this up before the
 * student is even allowed to run code.
 */
export function warmUpLocalRun(cppBaseUrl: string, pythonBaseUrl: string): void {
  const w = ensureWorker();
  w.postMessage({ cmd: 'warmup', reqId: nextReqId++, cppBaseUrl, pythonBaseUrl } as WorkerRequest);
}

export function runCppLocalInWorker(
  tabId: string, source: string, stdin: string, baseUrl: string,
  maxMemoryBytes: number, runTimeoutMs: number,
): Promise<LocalRunOutcome> {
  return sendRequest({ cmd: 'run-cpp', tabId, source, stdin, baseUrl, maxMemoryBytes }, runTimeoutMs);
}

export function runPythonLocalInWorker(source: string, stdin: string, baseUrl: string, runTimeoutMs: number): Promise<LocalRunOutcome> {
  return sendRequest({ cmd: 'run-python', source, stdin, baseUrl }, runTimeoutMs);
}
