
(function (window) {
  "use strict";
  window.App = window.App || {};
  function warnIfLarge(text, threshold=100000) {
    if (!text || typeof text !== "string") return;
    if (text.length > threshold) console.warn("Snapshot size is large; consider trimming inputs/outputs.");
  }
  window.App.Snapshots = { warnIfLarge };
})(window);
