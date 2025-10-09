
(function (window, document) {
  "use strict";
  window.App = window.App || {};
  const ROOT = document.documentElement;
  function get() { return ROOT.dataset.theme || "dark"; }
  function set(theme) { ROOT.dataset.theme = theme; }
  function toggle() { set(get() === "dark" ? "light" : "dark"); }
  window.App.Theme = { get, set, toggle };
})(window, document);
