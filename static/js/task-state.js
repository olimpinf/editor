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
