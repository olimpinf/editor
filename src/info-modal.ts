// static/js/info-modal.js (delegated, DOMContentLoaded-safe)
(function () {
  "use strict";
  if (window.__infoModalInit) return;
  window.__infoModalInit = true;

  /**
   * Finds the modal element in the DOM and ensures it's hidden by default.
   * @returns {HTMLElement|null} The modal element or null if not found.
   */
  function ensureModal() {
    const modal = document.getElementById("info-modal");
    if (modal) {
      // Ensure the modal is hidden on script initialization.
      if (!modal.hasAttribute("aria-hidden")) {
        modal.setAttribute("aria-hidden", "true");
      }
    }
    return modal;
  }

  function setup() {
    const modal = ensureModal();
    // If the modal HTML doesn't exist in editor.html, stop initialization.
    if (!modal) {
      console.warn("Modal element with ID 'info-modal' not found. Modal functionality will be disabled.");
      return;
    }

    const dialog  = modal.querySelector(".obi-modal__dialog");
    const backdrop= modal.querySelector(".obi-modal__backdrop");
    const btnClose= modal.querySelector("#info-close-btn");
    const btnOk   = modal.querySelector("#info-ok-btn");
    let lastFocusEl = null;

    function isOpen() { return modal.getAttribute("aria-hidden") === "false"; }

    function openModal() {
      lastFocusEl = document.activeElement;
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      // Focus the OK button, or the close button, or the dialog as a fallback
      (btnOk || btnClose || dialog).focus({ preventScroll: true });
    }

    function closeModal() {
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocusEl && typeof lastFocusEl.focus === "function") {
        lastFocusEl.focus({ preventScroll: true });
      }
    }

    // Event delegation for the open button
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest && e.target.closest("#info-btn");
      if (trigger) {
        e.preventDefault();
        openModal();
      }
    });

    // Close handlers
    btnClose?.addEventListener("click", closeModal);
    btnOk?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", closeModal);

    // Esc + simple focus trap
    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
      if (e.key === "Tab") {
        const focusables = dialog.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(el => !el.hasAttribute("disabled"));
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });

    // Public API
    window.showInfoModal = function (html) {
      const slot = document.getElementById("info-content");
      if (slot && typeof html === "string") slot.innerHTML = html;
      openModal();
    };
    window.closeInfoModal = closeModal;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
})();

