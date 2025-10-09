(function (window) {
  "use strict";
  window.App = window.App || {};
  const getKey = (taskId) => `taskState:${taskId}`;
  function save(taskId, state) {
    try { localStorage.setItem(getKey(taskId), JSON.stringify(state)); } catch (_) {}
  }
  function load(taskId) {
    try { const raw = localStorage.getItem(getKey(taskId)); return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
  }
  window.App.TaskState = { save, load };
    
})(window);

// === Per-task snapshot persistence ===
const STORAGE_PREFIX = "obi:taskstate:v1:";

function storageKey(taskId) {
  return `${STORAGE_PREFIX}${taskId}`;
}
function saveSnapshot(taskId, snap) {
  try { localStorage.setItem(storageKey(taskId), JSON.stringify(snap)); }
  catch (e) { console.warn("saveSnapshot failed", e); }
}

function loadSnapshot(taskId) {
  try {
      const key = storageKey(taskId);
    const raw = localStorage.getItem(key);

    if (raw) {
	// Normal case: restore previous snapshot
      return JSON.parse(raw);
    } else if (window.taskStates?.[taskId]) {
      // Initialize from your default window.taskStates
      const init = { ...window.taskStates[taskId] };
      localStorage.setItem(key, JSON.stringify(init));
      return init;
    } else {
      console.warn("loadSnapshot: no state found for", taskId);
      return null;
    }
  } catch (e) {
    console.warn("loadSnapshot failed", e);
    return null;
  }
}

(function (window) {
  "use strict";
  const PREFIXES = ["obi:taskstate:", "obi:status:"];
  const MAX_BYTES = 5 * 1024 * 1024;     // ~5 MB hard cap
  const PRUNE_THRESHOLD = 4 * 1024 * 1024; // start pruning above 4 MB
  const TARGET_AFTER_PRUNE = 3.5 * 1024 * 1024; // stop once below this

  function byteLen(str) {
    try { return new TextEncoder().encode(String(str)).length; }
    catch { return String(str).length * 2; }
  }

  function usageBytes() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      total += byteLen(k) + byteLen(v);
    }
    return total;
  }

  function getCandidateKeys() {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (PREFIXES.some(p => key.startsWith(p))) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          const ts = item?._lastAccess || 0;
          list.push({ key, ts });
        } catch {
          list.push({ key, ts: 0 });
        }
      }
    }
    return list;
  }

  function pruneOldest() {
    let used = usageBytes();
    if (used < PRUNE_THRESHOLD) return;

    const candidates = getCandidateKeys().sort((a, b) => a.ts - b.ts);
    console.warn(`[OBI Storage] usage ${Math.round(used / 1024)} KB; pruning…`);

    for (const c of candidates) {
      localStorage.removeItem(c.key);
      used = usageBytes();
      if (used < TARGET_AFTER_PRUNE) break;
    }

    console.info(`[OBI Storage] pruned; new usage ${Math.round(used / 1024)} KB`);
  }

  // Optional: tag writes with access time
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    if (PREFIXES.some(p => key.startsWith(p))) {
      try {
        const data = JSON.parse(value);
        data._lastAccess = Date.now();
        value = JSON.stringify(data);
      } catch (_) {}
    }
    return originalSetItem.call(localStorage, key, value);
  };

  window.App = window.App || {};
  window.App.PruneStorage = { usageBytes, pruneOldest };
})(window);

