(function(){
  function init() {
    if (window.App && window.App.AccessibleSelect) window.App.AccessibleSelect.enhanceAll(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
