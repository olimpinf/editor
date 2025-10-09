// static/js/info-modal.js (delegated, DOMContentLoaded-safe)
(function () {
  "use strict";
  if (window.__infoModalInit) return;
  window.__infoModalInit = true;

  function ensureModal() {
    let modal = document.getElementById("info-modal");
    if (modal) {
      if (!modal.hasAttribute("aria-hidden")) modal.setAttribute("aria-hidden", "true");
      return modal;
    }
    // Create minimal markup if not in HTML
    modal = document.createElement("div");
    modal.id = "info-modal";
    modal.className = "obi-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "info-title");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="obi-modal__backdrop" data-dismiss="modal" tabindex="-1"></div>
      <div class="obi-modal__dialog" role="document" tabindex="-1">
        <div class="obi-modal__header">
          <h2 id="info-title">Informações</h2>
          <button id="info-close-btn" class="obi-modal__close" aria-label="Fechar">✕</button>
        </div>
        <div id="info-content" class="obi-modal__body">
          <p>Adicione seu texto de ajuda aqui…</p>
        </div>
        <div class="obi-modal__footer">
          <button id="info-ok-btn" class="obi-modal__action">OK</button>
        </div>
      </div>
      <span class="obi-modal__sentry" tabindex="0" aria-hidden="true"></span>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  function setup() {
    const modal   = ensureModal();
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
      (btnClose || dialog).focus({ preventScroll: true });
    }
    function closeModal() {
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocusEl && typeof lastFocusEl.focus === "function") {
        lastFocusEl.focus({ preventScroll: true });
      }
    }

    // ✅ Event delegation for the open button (works even if button is injected later)
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

    // Public helpers
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
