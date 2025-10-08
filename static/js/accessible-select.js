(function (window, document) {
  "use strict";
  window.App = window.App || {};

  function enhance(root) {
    if (!root) return;
    const label = root.querySelector(".custom-select__label");
    const list = root.querySelector("[role='listbox']") || root.querySelector("ul");
    if (list && !list.getAttribute("role")) list.setAttribute("role", "listbox");
    const options = Array.from(list?.querySelectorAll("[role='option']") || list?.querySelectorAll("li") || []);
    options.forEach((li) => { if (!li.getAttribute("role")) li.setAttribute("role", "option"); if (!li.hasAttribute("aria-selected")) li.setAttribute("aria-selected", "false"); });

    function open() {
      root.setAttribute("aria-expanded", "true");
      if (list) { list.hidden = false; list.focus({ preventScroll: true }); }
      const selected = options.find(o => o.getAttribute("aria-selected") === "true") || options[0];
      if (selected) setActive(selected);
    }
    function close() {
      root.setAttribute("aria-expanded", "false");
      if (list) list.hidden = true;
      root.focus({ preventScroll: true });
    }
    function setActive(el) {
      options.forEach(o => o.classList.remove("is-active"));
      el.classList.add("is-active");
      if (list) list.setAttribute("aria-activedescendant", el.id || "");
    }
    function select(el, fireChange=true) {
      options.forEach(o => o.setAttribute("aria-selected", String(o === el)));
      if (label) label.textContent = el.textContent;
      root.dataset.value = el.dataset.value || el.getAttribute("data-value");
      if (fireChange) {
        root.dispatchEvent(new CustomEvent("customselect:change", {
          bubbles: true, detail: { value: root.dataset.value, label: el.textContent }
        }));
      }
      close();
    }

    root.addEventListener("click", (e) => {
      const expanded = root.getAttribute("aria-expanded") === "true";
      const opt = e.target.closest("[role='option']");
      if (opt) return select(opt);
      if (!expanded) open(); else if (e.target === root || e.target === label) close();
    });
    const onListKeyDown = (e) => {
      const key = e.key;
      const idx = options.findIndex(o => o.classList.contains("is-active"));
      const move = (delta) => {
        const next = options[Math.max(0, Math.min(options.length - 1, (idx < 0 ? 0 : idx) + delta))];
        if (next) setActive(next);
        e.preventDefault();
      };
      if (key === "Enter" || key === " ") { select(options.find(o => o.classList.contains("is-active")) || options[0]); e.preventDefault(); }
      else if (key === "ArrowDown") { if (root.getAttribute("aria-expanded") !== "true") return open(); move(1); }
      else if (key === "ArrowUp") { if (root.getAttribute("aria-expanded") !== "true") return open(); move(-1); }
      else if (key === "Home") { setActive(options[0]); e.preventDefault(); }
      else if (key === "End") { setActive(options[options.length - 1]); e.preventDefault(); }
      else if (key === "Escape") { close(); e.preventDefault(); }
    };
    const onRootKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") { open(); e.preventDefault(); }
    };

    if (list) list.addEventListener("keydown", onListKeyDown);
    root.addEventListener("keydown", onRootKeyDown);

    const selected = options.find(o => o.getAttribute("aria-selected") === "true") || options[0];
    if (selected) {
      if (!selected.id) selected.id = `${root.id || "custom-select"}-opt-${Math.random().toString(36).slice(2,7)}`;
      select(selected, false);
      setActive(selected);
    }

    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) if (root.getAttribute("aria-expanded") === "true") close();
    });
  }

  function enhanceAll(scope=document) {
    scope.querySelectorAll(".custom-select").forEach((el) => {
      if (!el.getAttribute("role")) el.setAttribute("role", "combobox");
      if (!el.getAttribute("aria-haspopup")) el.setAttribute("aria-haspopup", "listbox");
      if (!el.getAttribute("aria-expanded")) el.setAttribute("aria-expanded", "false");
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      enhance(el);
    });
  }

  window.App.AccessibleSelect = { enhance, enhanceAll };
})(window, document);
