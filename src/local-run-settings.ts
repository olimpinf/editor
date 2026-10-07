// Student-configurable execution limits for local "Executar" (gear icon ->
// modal). Persisted in localStorage like theme/font size (editor.ts), but —
// unlike those purely cosmetic prefs — these feed real sandbox limits, so
// every value is clamped to a hard ceiling here: there's no server
// enforcing this, so the clamp *is* the enforcement. A student can tighten
// limits for faster iteration but never loosen them past what's allowed.
// Same design as stress_test's settings.ts (same reasoning throughout).
//
// Memory is C++-only: it's a link-time wasm-ld --max-memory flag (see
// local-cpp.ts's compileCpp), and there's no equivalent lever for
// Pyodide's own WASM memory growth, which this app doesn't control. The
// time limit applies to both languages equally -- it's just a
// Worker.terminate() deadline, language-agnostic.

export interface LocalRunSettings {
  timeLimitMs: number;
  maxMemoryBytes: number;
}

const KEY = 'obi:editor:localRunSettings';

// WASM memory is paged in 64KiB units; wasm-ld's --max-memory requires a
// page-aligned byte count. Any whole-MiB value already satisfies this
// (1 MiB = 16 pages exactly), so inputs are kept/rounded to whole MiB.
const PAGE_SIZE = 65536;
const MiB = 1024 * 1024;

export const CAPS = {
  // 8s matches the original fixed LOCAL_RUN_TIMEOUT_MS this replaces.
  timeLimitS: { min: 1, max: 60, default: 8 },
  // 1024MB matches OBI tasks' own default memory limit (same default used
  // for stress_test's equivalent setting, for consistency between tools).
  maxMemoryMiB: { min: 16, max: 4096, default: 1024 },
};

function clampInt(value: unknown, { min, max }: { min: number; max: number }): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function defaults(): LocalRunSettings {
  return {
    timeLimitMs: CAPS.timeLimitS.default * 1000,
    maxMemoryBytes: CAPS.maxMemoryMiB.default * MiB,
  };
}

/** Clamps a {timeLimitS, maxMemoryMiB} form-shaped input into stored LocalRunSettings. */
export function clampSettings(input: { timeLimitS: unknown; maxMemoryMiB: unknown }): LocalRunSettings {
  const maxMemoryMiB = clampInt(input.maxMemoryMiB, CAPS.maxMemoryMiB);
  return {
    timeLimitMs: clampInt(input.timeLimitS, CAPS.timeLimitS) * 1000,
    maxMemoryBytes: Math.floor((maxMemoryMiB * MiB) / PAGE_SIZE) * PAGE_SIZE,
  };
}

export function loadSettings(): LocalRunSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    // Re-clamp on load too, not just on save -- covers a cap changing in a
    // future version of this app while an old value is still in storage.
    return clampSettings({
      timeLimitS: parsed.timeLimitMs / 1000,
      maxMemoryMiB: parsed.maxMemoryBytes / MiB,
    });
  } catch {
    return defaults();
  }
}

export function saveSettings(settings: LocalRunSettings): void {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}
