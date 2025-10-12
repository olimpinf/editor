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

function saveSnapshot(taskId, snap) {
  try { localStorage.setItem(window.currentTask, JSON.stringify(snap)); }
  catch (e) { console.warn("saveSnapshot failed", e); }
}

function loadSnapshot(taskId) {
  try {
      const key = window.currentTask;
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


// ====  Tabs  ====
// === Dynamic Tabs (storage keys) ===
const TABS_INDEX_KEY = "obi:tabs:index:v1";   // array of tabIds, in order
const LAST_TAB_KEY   = "obi:lastTabId";       // active tab id
const SNAP_PREFIX    = "obi:tab:v1:";         // per-tab snapshot key prefix

function tabStorageKey(tabId) { return `${SNAP_PREFIX}${tabId}`; }

function readTabsIndex() {
  const bbb = localStorage.getItem(TABS_INDEX_KEY);
    const ddd = bbb ? JSON.parse(bbb) : null;
  try {
    const raw = localStorage.getItem(TABS_INDEX_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeTabsIndex(list) {
  try { localStorage.setItem(TABS_INDEX_KEY, JSON.stringify(list)); } catch {}
}

function saveTabSnapshot(tabId, snap) {
  try { localStorage.setItem(tabStorageKey(tabId), JSON.stringify(snap)); } catch {}
}

function loadTabSnapshot(tabId) {
  try {
    const raw = localStorage.getItem(tabStorageKey(tabId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Global: remember active tab
function setLastTab(tabId) { try { localStorage.setItem(LAST_TAB_KEY, tabId); } catch {} }
function getLastTab() { try { return localStorage.getItem(LAST_TAB_KEY) || null; } catch { return null; } }

function makeTabIdFromTitle(title) {
  // unique-ish id: sanitized title + timestamp
  const base = String(title || "tab")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "tab";
  return `${base}-${Date.now().toString(36)}`;
}

function newTab(initialTitle = "") {
  const title = initialTitle || prompt("Nome da nova aba:", "Tarefa");
  if (!title) return;

  const tabId = makeTabIdFromTitle(title);
  const tabs = readTabsIndex();
  tabs.push(tabId);
  writeTabsIndex(tabs);

  const lang = document.getElementById("language-select")?.value || "cpp";
  const initSnap = {
    id: tabId,
    title: title,
    language: lang,
    code: window.templates?.[lang] || "",
    input: "",
    output: ""
  };
    saveTabSnapshot(tabId, initSnap);

  renderTabs(tabId);       // selects new tab
    loadTabIntoUI(tabId);    // sets editor/input/output


}

function renameTab(tabId) {
  const snap = loadTabSnapshot(tabId);
  if (!snap) return;
  const next = prompt("Renomear aba:", snap.title || "");
  if (!next || next === snap.title) return;
  snap.title = next;
  saveTabSnapshot(tabId, snap);
  renderTabs(tabId);
}

function closeTab(tabId) {
  const tabs = readTabsIndex();
  const idx = tabs.indexOf(tabId);
  if (idx < 0) return;
    if (!confirm("Fechar esta aba? O código, a entrada e a saída serão descartados e não será possível recuperá-los.")) return;

  // Remove snapshot and id
  try { localStorage.removeItem(tabStorageKey(tabId)); } catch {}
  tabs.splice(idx, 1);
  writeTabsIndex(tabs);

  // Choose next active
  const nextActive = tabs[idx] || tabs[idx - 1] || tabs[0] || null;
  renderTabs(nextActive);
  if (nextActive) loadTabIntoUI(nextActive);
  else { // no tabs → create one
    newTab("Tarefa");
  }
}
