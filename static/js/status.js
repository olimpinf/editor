
(function (window, document) {
  "use strict";
  window.App = window.App || {};

  const STORE = new Map();

  // read the human label from editor.js (falls back to id)
  function getTaskLabel(taskId) {
    try {
      return (window.taskStates && window.taskStates[taskId] && window.taskStates[taskId].title) || taskId || "—";
    } catch (_) {
      return taskId || "—";
    }
  }

  function get(taskId) {
    return STORE.get(taskId) || { text: "Inativo", spinning: false };
  }

  function set(taskId, text, { spinning=false } = {}) {
    if (!taskId) return;
    STORE.set(taskId, { text, spinning });
    if (taskId === window.currentTask) renderFor(taskId);
  }

  function renderFor(taskId) {
    const { text, spinning } = get(taskId);
    const labelEl = document.getElementById("status-label");
    const spinEl  = document.getElementById("status-spinner");

    if (labelEl) {
      // Show task label so switching tasks is visible even when text is identical
      const taskLabel = getTaskLabel(taskId);
      labelEl.textContent = `${text} — ${taskLabel}`;
    }

    if (spinEl)  spinEl.hidden = !spinning;
  }

  function setForCurrent(text, opts) { set(window.currentTask, text, opts); }
  function renderCurrent() { renderFor(window.currentTask); }

  window.App.Status = { get, set, setForCurrent, renderFor, renderCurrent };
})(window, document);
