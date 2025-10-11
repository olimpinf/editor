// === Global Theme (applies to all tasks) ===
const THEME_KEY = "obi:globalTheme"; // 'light' | 'dark'

function getGlobalTheme() {
  try { return localStorage.getItem(THEME_KEY) || "dark"; }
  catch { return "dark"; }
}

function setGlobalTheme(mode /* 'light'|'dark' */) {
  try { localStorage.setItem(THEME_KEY, mode); } catch {}
  applyGlobalTheme(mode);
}

function initGlobalTheme() {
  const mode = getGlobalTheme();
  applyGlobalTheme(mode);
}

function applyGlobalTheme(mode) {
  // mode: 'light' or 'dark'
  const light = (mode === 'light');

  // Right panes: add/remove .light-mode on their content containers
  const rtop = document.querySelector('#pane-rtop .pane-container');
  const rbot = document.querySelector('#pane-rbot .pane-container');
  rtop?.classList.toggle('light-mode', light);
  rbot?.classList.toggle('light-mode', light);

  // Monaco editor theme (left pane)
  if (window.monaco?.editor && window.editor) {
    window.monaco.editor.setTheme(light ? 'vs' : 'vs-dark');
  }
    
    if (light) {
	replaceColor(rbot, colorInfoTextDark, colorInfoTextLight);
	replaceColor(rbot, colorEmphasisTextDark, colorEmphasisTextLight);
    }
    else {
	replaceColor(rbot, colorInfoTextLight, colorInfoTextDark);
	replaceColor(rbot, colorEmphasisTextLight, colorEmphasisTextDark);
    }    
}


(function (window, document) {
  "use strict";
  window.App = window.App || {};
  const ROOT = document.documentElement;
  function get() { return ROOT.dataset.theme || "light"; }
  function set(theme) { ROOT.dataset.theme = theme; }
  function toggle() { set(get() === "dark" ? "light" : "dark"); }
  window.App.Theme = { get, set, toggle };
})(window, document);
