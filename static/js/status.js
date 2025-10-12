(function (window, document) {
  "use strict";
  window.App = window.App || {};

  // In-memory cache: taskId -> { text, spinning }
  const STORE = new Map();

  // Persist to localStorage so status survives reloads
  const PREFIX = "obi:status:"; // key: obi:status:<taskId>

  function loadFromStorage(taskId) {
    try {
      const raw = localStorage.getItem(PREFIX + taskId);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
  function saveToStorage(taskId, data) {
    try {
      localStorage.setItem(PREFIX + taskId, JSON.stringify(data));
    } catch (_) {
      // ignore quota errors
    }
  }
  function removeFromStorage(taskId) {
    try { localStorage.removeItem(PREFIX + taskId); } catch (_) {}
  }

  function get(taskId) {
    // prefer memory, then storage, then default
    return STORE.get(taskId) || loadFromStorage(taskId) || { text: "Inativo", spinning: false };
  }

  function set(taskId, text, { spinning = false } = {}) {
    if (!taskId) return;
    const payload = { text, spinning };
    STORE.set(taskId, payload);
    saveToStorage(taskId, payload);
    if (taskId === window.currentTask) renderFor(taskId);
  }

  function clear(taskId) {
    if (!taskId) return;
    STORE.delete(taskId);
    removeFromStorage(taskId);
    if (taskId === window.currentTask) renderFor(taskId);
  }

  function clearAll() {
    // remove all keys with our prefix
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
    STORE.clear();
    renderCurrent();
  }

  function renderFor(taskId) {
    const { text, spinning } = get(taskId);
    const labelEl = document.getElementById("status-label");
    const taskEl  = document.getElementById("status-task");
    const spinEl  = document.getElementById("status-spinner");

    const tabTitle = getTabTitle(taskId);

   if (taskEl) {
      taskEl.textContent = `${tabTitle}`;
    }
   if (labelEl) {
      labelEl.textContent = `${text}`;
    }
    if (spinEl)  spinEl.hidden = !spinning;
  }

  // Convenience helpers for the current task
  function setForCurrent(text, opts)       { set(window.currentTask, text, opts); }
  function renderCurrent()                 { renderFor(window.currentTask); }
  function clearForCurrent()               { clear(window.currentTask); }

  window.App.Status = {
    get, set, renderFor,
    setForCurrent, renderCurrent,
    clear, clearForCurrent, clearAll
  };
})(window, document);

