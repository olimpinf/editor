window.runningTaskId   = null;
window.runningLanguage = null;
window.lastRunStartMs  = 0;     // <— from click time
window.cooldownTimerId = null;
window.colorInfoTextLight = "Blue";
window.colorInfoTextDark = "Gold";
window.colorEmphasisTextLight = "Green";
window.colorEmphasisTextDark = "YellowGreen";

initGlobalTheme();

// 1. Import the language client function from our other module.
//import { startLanguageClient } from './language-client.js';

// 2. Wait for the entire page to load. This solves the race condition where
//    `loader.js` hasn't created `window.require` yet.
window.addEventListener('DOMContentLoaded', () => {

    // 3. Now that we know loader.js is ready, use window.require to load Monaco.
    window.require(['vs/editor/editor.main'], () => {

	const monaco = window.monaco;
	const container = document.getElementById('editor-container');

	// starter templates
	window.templates = {
	    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Start coding here

    return 0;
}`,
	    java: `public class tarefa {
    public static void main(String[] args) {
        // Start coding here
    }
}`,
	    python: `def main():
    # Start coding here
    pass

if __name__ == "__main__":
    main()`
	};

	// === Tabs (dynamic tasks) ===
	const TABS_INDEX_KEY = "obi:tabs:index:v1";     // stores array of tabIds in order
	const LAST_TAB_KEY   = "obi:lastTabId";         // currently active tab id
	const SNAP_PREFIX    = "obi:tab:v1:";           // per-tab snapshot key prefix
	
	function tabStorageKey(tabId) { return `${SNAP_PREFIX}${tabId}`; }
	
	// Snapshot shape per tab
	// { id, title, language, code, input, output }

	
	// Initialize editor
	window.editor = monaco.editor.create(document.getElementById('editor-container'), {
	    value: templates.cpp,   // default
	    language: 'cpp',
	    theme: 'vs',
	    automaticLayout: true,
	    fontSize: 14,
	    minimap: { enabled: false },
	    padding: { top: 10 }  
	});

	// After Monaco is ready, initialize LSP
	//setTimeout(() => {
	// Initialize LSP
	if (typeof window.initLanguageClient === 'function') {
            window.initLanguageClient(monaco, window.editor, {
		socketUrl: 'wss://olimpiada.ic.unicamp.br/ws/clangd/',
		languages: ['cpp', 'c'],
		debounceDelay: 300,
		maxConcurrentRequests: 2
            });
	} else {
            console.warn('[LSP] initLanguageClient not available');
	}
	//}, 100);
	
	applyGlobalTheme(getGlobalTheme());
	initFirstTabIfNeeded();

	
	// ======== Exam Gate (poll remote endpoint and lock UI until "ready") ========
	(function ExamGate() {
	    if (!window.AppConfig?.examGate?.enabled) return; 
	    
	    const ENDPOINT = "https://olimpiada.ic.unicamp.br/can_start";
	    const POLL_MS = 5000;     // poll every 5s (adjust if you like)
	    const TIMEOUT_MS = 4000;  // fetch timeout
	    let pollTimer = null;
	    let lastState = null;     // 'ready' | 'not_ready' | null

	    // --- DOM helpers ---
	    function ensureModal() {
		if (document.getElementById("exam-gate-overlay")) return;
		const css = document.createElement("style");
		css.id = "exam-gate-style";
		css.textContent = `
#exam-gate-overlay {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.55);
  z-index: 9999;
}
#exam-gate-dialog {
  background: var(--gate-bg, #1e1e1e);
  color: var(--gate-fg, #fff);
  width: min(90vw, 540px);
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 10px 28px rgba(0,0,0,.45);
}
#exam-gate-dialog h2 { margin: 0 0 8px; font-size: 20px; }
#exam-gate-dialog p { margin: 0 0 12px; line-height: 1.4; opacity: .9; }
#exam-gate-spinner {
  margin-top: 6px;
  width: 24px; height: 24px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,.25);
  border-top-color: rgba(255,255,255,.9);
  animation: egspin 1s linear infinite;
}
@keyframes egspin { to { transform: rotate(360deg); } }
.hidden { display:none !important; }
.locked-pointer { pointer-events: none !important; }
    `;
		document.head.appendChild(css);

		const overlay = document.createElement("div");
		overlay.id = "exam-gate-overlay";
		overlay.setAttribute("role", "dialog");
		overlay.setAttribute("aria-modal", "true");
		overlay.setAttribute("aria-live", "polite");
		overlay.classList.add("hidden");

		overlay.innerHTML = `
      <div id="exam-gate-dialog">
        <h2>Exame não iniciado</h2>
        <p>Volte à aba do exame e clique no botão <em>Iniciar</em>. Esta página será liberada automaticamente quando o exame começar.</p>
        <div id="exam-gate-spinner" aria-hidden="true"></div>
      </div>
    `;
		document.body.appendChild(overlay);
	    }

	    function showModal() {
		ensureModal();
		document.getElementById("exam-gate-overlay")?.classList.remove("hidden");
	    }
	    function hideModal() {
		document.getElementById("exam-gate-overlay")?.classList.add("hidden");
	    }

	    function setAppInteractivity(enabled) {
		// 1) Monaco
		if (window.editor?.updateOptions) {
		    window.editor.updateOptions({ readOnly: !enabled });
		}

		// 2) Textareas & inputs
		const stdin = document.getElementById("stdin-input");
		if (stdin) stdin.disabled = !enabled;

		// 3) Buttons & selects
		const disableSel = [
		    "#run-btn", "#font-btn", "#global-style-toggle",
		    "#download-btn", "#upload-btn", "#clear-btn",
		    "#download-input-btn", "#upload-input-btn", "#clear-input-btn",
		    "#download-output-btn", "#clear-output-btn",
		    "#language-select", "#task-select",
		    ".btn-expand"
		];
		disableSel.forEach(sel => {
		    document.querySelectorAll(sel).forEach(el => {
			if (el.tagName === "SELECT" || el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
			    el.disabled = !enabled;
			} else {
			    el.setAttribute("tabindex", enabled ? "0" : "-1");
			    el.setAttribute("aria-disabled", String(!enabled));
			    if ("disabled" in el) el.disabled = !enabled;
			}
		    });
		});

		// 4) Prevent accidental clicks through custom UI layers
		const container = document.getElementById("container");
		if (container) {
		    if (!enabled) container.classList.add("locked-pointer");
		    else container.classList.remove("locked-pointer");
		}
	    }

	    // --- Fetch with timeout & CORS note ---
	    async function fetchWithTimeout(url, ms) {
		const ctrl = new AbortController();
		const id = setTimeout(() => ctrl.abort(), ms);
		try {
		    const res = await fetch(url, {
			method: "GET",
			cache: "no-store",
			credentials: "include", // adjust if you need cookies
			headers: { "Accept": "application/json" },
			signal: ctrl.signal
		    });
		    clearTimeout(id);
		    return res;
		} catch (e) {
		    clearTimeout(id);
		    throw e;
		}
	    }

	    function parseReady(json) {
		// Accept {status:"ready"} or {ready:true} or "ready"
		if (typeof json === "string") return json.toLowerCase() === "ready";
		if (json && typeof json === "object") {
		    if ("status" in json) return String(json.status).toLowerCase() === "ready";
		    if ("ready" in json) return !!json.ready;
		}
		return false;
	    }

	    async function checkGateOnce() {
		try {
		    const res = await fetchWithTimeout(ENDPOINT, TIMEOUT_MS);
		    if (!res.ok) throw new Error(`HTTP ${res.status}`);
		    const data = await res.json();
		    const isReady = parseReady(data);

		    if (isReady) {
			if (lastState !== "ready") {
			    lastState = "ready";
			    hideModal();
			    setAppInteractivity(true);
			}
		    } else {
			if (lastState !== "not_ready") {
			    lastState = "not_ready";
			    showModal();
			    setAppInteractivity(false);
			}
		    }
		} catch (err) {
		    // Network/CORS error: be conservative (lock UI) but keep polling
		    if (lastState !== "not_ready") {
			lastState = "not_ready";
			showModal();
			setAppInteractivity(false);
		    }
		    // console.warn("Exam gate poll failed:", err);
		}
	    }

	    function startPolling() {
		// initial lock until first response
		lastState = null;
		showModal();
		setAppInteractivity(false);

		// kick off immediately, then poll
		checkGateOnce();
		clearInterval(pollTimer);
		pollTimer = setInterval(checkGateOnce, POLL_MS);
	    }

	    // Start once DOM and Monaco are ready enough
	    if (document.readyState === "complete" || document.readyState === "interactive") {
		ensureModal();
		startPolling();
	    } else {
		window.addEventListener("DOMContentLoaded", () => {
		    ensureModal();
		    startPolling();
		});
	    }
	})();
	
	// 1) Editor content changes
	if (window.editor?.onDidChangeModelContent) {
	    window.editor.onDidChangeModelContent(() => {
		scheduleSaveSnapshot();
	    });
	}
	
	// 2) STDIN textarea changes
	const stdin = document.getElementById("stdin-input");
	if (stdin && !stdin.__wiredSnapshot) {
	    stdin.addEventListener("input", scheduleSaveSnapshot);
	    stdin.__wiredSnapshot = true;
	}
	
	// 3) Language changes (if you want them persisted too)
	const langSel = document.getElementById("language-select");
	if (langSel && !langSel.__wiredSnapshot) {
	    langSel.addEventListener("change", scheduleSaveSnapshot);
	    langSel.__wiredSnapshot = true;
	}


	const langMap = { cpp: 'cpp', java: 'java', python: 'python' };

	document.getElementById("global-style-toggle")?.addEventListener("click", ()  => {
            const now = getGlobalTheme(); 
	    const next = now === 'light' ? 'dark' : 'light';
	    setGlobalTheme(next);
	});

	// --- Handle Tab creation ---
	document.getElementById("new-tab-btn")?.addEventListener("click", () => newTab(""));
	
	// --- Handle Task Switch ---
	document.getElementById('task-select')?.addEventListener('change', function(e) {
	    const newTaskID = e.target.value;
	    
	    // 2. Load the state of the NEW task
	    loadTabIntoUI(newTaskID);
            try { localStorage.setItem('obi:lastTask', newTaskID); } catch (_) {}
	});

	function switchLanguage(lang) {
            monaco.editor.setModelLanguage(window.editor.getModel(), lang);
	    // If LSP is active and language is C++/C, it will automatically handle it
	    // For other languages, LSP can be disabled
	    if (lang === 'cpp' || lang === 'c') {
		console.log('[LSP] Switched to', lang);
	    } else {
		console.log('[LSP] Language', lang, 'does not support LSP');
	    }
	}
	
	function getSanitizedTabName() {
	    const tabId = window.currentTask;
	    const snap = tabId && loadTabSnapshot(tabId);
	    const raw = snap?.title || tabId || "programa";
	    let sanitized = raw.replace(/[\s:-]+/g, '_').replace(/[^a-zA-Z0-9_]+/g, '');
	    sanitized = sanitized.toLowerCase().replace(/^_|_$/g, '');
	    return sanitized || 'programa';
	}

	// Download buttons
	function downloadContent(filename, content) {
	    const blob = new Blob([content], { type: 'text/plain' });
	    const url = URL.createObjectURL(blob);
	    const a = document.createElement('a');
	    a.href = url;
	    a.download = filename;
	    document.body.appendChild(a);
	    a.click();
	    document.body.removeChild(a);
	    URL.revokeObjectURL(url);
	}


	document.getElementById('download-btn')?.addEventListener('click', () => {
	    const baseFilename = getSanitizedTabName();
	    
	    const langSelect = document.getElementById('language-select');
	    const lang = langSelect ? langSelect.value : 'txt';
	    let ext = 'txt';
	    if (lang === 'cpp') ext = 'cpp';
	    else if (lang === 'java') ext = 'java';
	    else if (lang === 'python') ext = 'py';
	    
	    const filename = `${baseFilename}.${ext}`;
	    const content = window.editor.getValue(); 	
	    downloadContent(filename, content);
	});

	document.getElementById('download-input-btn')?.addEventListener('click', () => {
	    const content = document.getElementById('stdin-input')?.value ?? "";
	    downloadContent('entrada.txt', content);
	});

	document.getElementById('download-output-btn')?.addEventListener('click', () => {
	    // Get text content from the <pre> tag inside the output container
	    const outputContainer = document.getElementById('stdout-output');
	    const htmlContent = outputContainer?.innerHTML ?? "";
	    const txtContent = removeHtmlTags(htmlContent);
	    downloadContent('saida.txt', txtContent);
	});

	// ============================================================
	// LANGUAGE CHANGE HANDLERS (manual vs programmatic)
	// ============================================================
	// Manual user selection: always switch language and load template
	(function wireManualLanguageChange(){
	    const select = document.getElementById('language-select');
	    if (!select || select.__wiredManual) return;
	    select.__wiredManual = true;

	    select.addEventListener('change', (e) => {
		const lang = e.target.value;

		// Check if current code is non-empty or custom before replacing
		const currentCode = (window.editor?.getValue() || "").trim();
		const isTemplate = Object.values(window.templates || {}).some(
		    t => t.trim() === currentCode
		);

		if (currentCode && !isTemplate) {
		    const proceed = confirm(
			"Ao alterar a linguagem seu código atual será perdido. Continuar?"
		    );
		    if (!proceed) {
			// Revert select UI back to previous language
			window.syncLanguageSelectorUI?.();
			return;
		    }
		}

		switchLanguage(lang);

		// Replace editor content with starter template for selected language
		const tmpl = (window.templates && window.templates[lang]) || "// Start coding here";
		if (window.editor?.setValue) window.editor.setValue(tmpl);

		// Sync UI and persist state
		window.syncLanguageSelectorUI?.();
		window.scheduleSaveSnapshot?.();
	    });	
	})();

	// Programmatic setter: call directly, no events or flags
	window.setLanguageProgrammatic = function setLanguageProgrammatic(lang, { injectTemplate = false } = {}) {
	    const select = document.getElementById('language-select');
	    if (!select) return false;
	    const idx = Array.from(select.options).findIndex(o => o.value === lang);
	    if (idx < 0) return false;
	    // sync <select>
	    select.selectedIndex = idx;
	    // update Monaco mode immediately
	    switchLanguage(lang);
	    // optional template injection
	    if (injectTemplate) {
		const tmpl = (window.templates && window.templates[lang]) || "// Start coding here";
		window.editor?.setValue?.(tmpl);
	    }
	    // Sync visible custom select face and save
	    window.syncLanguageSelectorUI?.();
	    window.scheduleSaveSnapshot?.();
	    return true;
	};
	
	// Run button
	document.getElementById('run-btn')?.addEventListener('click', async () => { // Make the handler async
	    // Clear any previous running tests
	    if (runningTaskId != null) {
		alert(
		    `Há uma execução em andamento, aguarde.`
		);
		return;
	    }
	    else {
		const left = cooldownLeft();
		if (left > 0) {
		    alert(`Aguarde ${left}s para executar novamente.`);
		    return;
		}
	    }
	    // Start cooldown
	    markRunStart();
	    //lastRunStartMs = Date.now();
	    startCooldownTicker();
	    const cmsLanguage = {'cpp': "C++20 / g++", 'python': "Python 3 / PyPy", 'java': 'Java / JDK'};
	    const cmsExtension = {'cpp': "cpp", 'python': "py", 'java': 'java'};
	    const code = window.editor.getValue();
	    const input = document.getElementById('stdin-input')?.value ?? "";
	    const selectedLanguage = document.getElementById('language-select')?.value ?? "cpp"; // Get language dynamically
	    const language = cmsLanguage[selectedLanguage];
	    const languageExtension = cmsExtension[selectedLanguage];

	    runningTaskId = getCurrentTaskId()
	    setRunningTab(runningTaskId);             // show spinner on that tab
	    setStatusLabel('Preparando…', { spinning: false, tabId: runningTaskId });
	    runningLanguage = selectedLanguage;
	    const theme = getGlobalTheme();
	    const colorEmphasis = theme === 'light' ? colorEmphasisTextLight : colorEmphasisTextDark;
	    const initMessage = "\n" + "<b>" + getLocalizedTime() + "</b>" + ": execução iniciada\n";
	    
	    displayProgramOutput(formatOutput(initMessage, colorEmphasis));
	    try {
		// Submit the code and get the test ID
		const submissionResult = await cmsTestSend(runningTaskId, code, input, language, languageExtension);
		const testId = submissionResult.data.id;
		
		// Start polling for the status
		await pollTestStatus(testId);

	    } catch (error) {
		console.warn("CMS Test Submission Failed:", error);
		setStatusLabel("Execução falhou", { spinning: false });
		displayProgramOutput(formatOutput("Execução falhou.", "red"));
	    }
	    scheduleSaveSnapshot();	
	});

	// Clear button
	document.getElementById('clear-btn').addEventListener('click', () => {
	    if (confirm("Tem certeza que deseja limpar a área de código??")) {
		window.editor.setValue("");
	    }
	    scheduleSaveSnapshot();	
	});    

	// Clear Input button
	document.getElementById('clear-input-btn')?.addEventListener('click', () => {
	    const taskId = getCurrentTaskId?.() || window.currentTask;

	    const inputEl = document.getElementById('stdin-input');
	    if (inputEl) inputEl.value = '';
	    scheduleSaveSnapshot?.();
	});

	// Clear Output button
	document.getElementById('clear-output-btn')?.addEventListener('click', () => {
	    const taskId = getCurrentTaskId?.() || window.currentTask;

	    const out = document.getElementById('stdout-output');
	    if (out) out.innerHTML = '';

	    if (taskId) {
		_outputBuffers[taskId] = '';
	    }

	    scheduleSaveSnapshot();
	});

	// Font size button
	(function setupFontCycler() {
	    const btn = document.getElementById("font-btn");
	    if (!btn) return;

	    // cycle order: medium (default) → small → large → medium ...
	    const sizes = ["small", "medium", "large", "extralarge"];
	    const fontMap = { small: 10, medium: 12, large: 14, extralarge: 16};
	    let idx = 1;

	    // restore saved size if any
	    const saved = localStorage.getItem("editorFontSize");
	    if (saved && sizes.includes(saved)) {
		idx = sizes.indexOf(saved);
	    }

	    function applyFontSize(size) {
		const pt = fontMap[size];

		// Update Monaco editor
		if (window.editor) {
		    window.editor.updateOptions({ fontSize: pt });
		}

		// Update input & output panes
		const stdin = document.getElementById("stdin-input");
		const stdout = document.getElementById("stdout-output");
		if (stdin) stdin.style.fontSize = `${pt}px`;
		if (stdout) stdout.style.fontSize = `${pt}px`;

		// Persist and log
		localStorage.setItem("editorFontSize", size);
	    }

	    // apply initial size
	    applyFontSize(sizes[idx]);

	    // cycle on button click
	    btn.addEventListener("click", () => {
		idx = (idx + 1) % sizes.length;
		applyFontSize(sizes[idx]);
	    });
	})();


    }); // End of window.require callback
}); // End of DOMContentLoaded listener

var outputBuffer = "";

(function() {
    const expandButtons = document.querySelectorAll('.btn-expand');
    const body = document.body;

    function collapseAll() {
	const expanded = document.querySelector('.pane.expanded');
	if (expanded) {
	    expanded.classList.remove('expanded');
	    body.classList.remove('pane-expanded');
	    // restore scroll lock
	    document.documentElement.style.overflow = '';
	    document.body.style.overflow = '';
	}
    }

    function toggleExpand(targetId){
	const pane = document.getElementById(targetId);
	if (!pane) return;
	const isExpanded = pane.classList.contains('expanded');

	if (isExpanded) {
	    collapseAll();
	} else {
	    // collapse first any existing expanded
	    collapseAll();
	    // expand this pane
	    pane.classList.add('expanded');
	    body.classList.add('pane-expanded');
	    // prevent page behind from scrolling (optional)
	    document.documentElement.style.overflow = 'hidden';
	    document.body.style.overflow = 'hidden';
	    // focus first focusable element in pane (if any) for a11y
	    const focusable = pane.querySelector('button, a, input, textarea');
	    if (focusable) focusable.focus();
	}
    }

    expandButtons.forEach(btn => {
	btn.addEventListener('click', (e) => {
	    e.stopPropagation();
	    const target = btn.getAttribute('data-target');
	    toggleExpand(target);
	});
    });

    // Escape to collapse
    document.addEventListener('keydown', (ev) => {
	if (ev.key === 'Escape' || ev.key === 'Esc') {
	    collapseAll();
	}
    });

    // Handle double-click on the bar as an alternate expand/restore
    document.querySelectorAll('.bar').forEach(bar => {
	bar.addEventListener('dblclick', () => {
	    const pane = bar.closest('.pane');
	    if (pane) toggleExpand(pane.id);
	});
    });

    // If the user clicks empty area while expanded, do not accidentally collapse.
    // We only collapse using the button or Esc.
})();


// custom select for language
// --- Custom Select for #language-select ---
(function initCustomSelect() {
    const wrap = document.getElementById('language-select-wrapper');
    if (!wrap) return;                           // HTML wrapper required
    const select = wrap.querySelector('select');
    if (!select) return;

    // Build visible UI
    const face = document.createElement('div');
    face.className = 'select-selected';
    face.setAttribute('tabindex', '0');
    face.setAttribute('role', 'combobox');
    face.setAttribute('aria-expanded', 'false');
    face.setAttribute('aria-haspopup', 'listbox');
    face.textContent = select.options[select.selectedIndex]?.text ?? '';

    const panel = document.createElement('div');
    panel.className = 'select-items';
    panel.setAttribute('role', 'listbox');

    const items = [...select.options].map((opt, idx) => {
	const item = document.createElement('div');
	item.textContent = opt.text;
	item.setAttribute('role', 'option');
	if (idx === select.selectedIndex) item.classList.add('is-active');
	item.addEventListener('mouseenter', () => setActive(idx));
	item.addEventListener('click', () => commitSelection(idx));
	panel.appendChild(item);
	return item;
    });

    wrap.append(face, panel);

    let activeIndex = select.selectedIndex;

    function setActive(i) {
	if (i < 0) i = items.length - 1;
	if (i >= items.length) i = 0;
	items.forEach(n => n.classList.remove('is-active'));
	items[i].classList.add('is-active');
	activeIndex = i;
	items[i].scrollIntoView({ block: 'nearest' });
    }

    function openDropdown() {
	wrap.classList.add('open');
	face.setAttribute('aria-expanded', 'true');
	setActive(select.selectedIndex);
    }

    function closeDropdown() {
	wrap.classList.remove('open');
	face.setAttribute('aria-expanded', 'false');
    }

    function commitSelection(i) {
	if (i !== select.selectedIndex) {
	    select.selectedIndex = i;
	    // Update visible text and fire a native change so your existing code runs
	    face.textContent = select.options[i]?.text ?? '';
	    select.dispatchEvent(new Event('change', { bubbles: true }));
	}
	closeDropdown();
    }

    // Mouse toggle
    face.addEventListener('click', (e) => {
	e.stopPropagation();
	wrap.classList.contains('open') ? closeDropdown() : openDropdown();
    });

    // Keyboard on the face
    face.addEventListener('keydown', (e) => {
	const open = wrap.classList.contains('open');
	if ((e.key === 'Enter' || e.key === ' ') && !open) { e.preventDefault(); openDropdown(); return; }
	if (!open) return;
	if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
	else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
	else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
	else if (e.key === 'End') { e.preventDefault(); setActive(items.length - 1); }
	else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commitSelection(activeIndex); }
	else if (e.key === 'Escape') { e.preventDefault(); closeDropdown(); }
    });

    // Keep UI in sync if code changes the native select
    select.addEventListener('change', () => {
	const i = select.selectedIndex;
	face.textContent = select.options[i]?.text ?? '';
	items.forEach(n => n.classList.remove('is-active'));
	items[i]?.classList.add('is-active');
    });

    // Close on outside click
    document.addEventListener('click', closeDropdown);
})();


window.syncTaskSelectorUI = function syncTaskSelectorUI() {
    const wrap   = document.getElementById('task-select-wrapper');
    const select = document.getElementById('task-select');
    if (!wrap || !select) return;

    const face  = wrap.querySelector('.select-selected');
    const items = wrap.querySelectorAll('.select-items div');

    const idx = select.selectedIndex >= 0 ? select.selectedIndex : 0;

    if (face) face.textContent = select.options[idx]?.text || '';
    if (items && items.length) {
	items.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    }
};

// Keep the custom language select UI in sync with the native <select>
window.syncLanguageSelectorUI = function syncLanguageSelectorUI() {
    const wrap   = document.getElementById('language-select-wrapper');
    const select = document.getElementById('language-select');
    if (!wrap || !select) return;
    const face  = wrap.querySelector('.select-selected');
    const items = wrap.querySelectorAll('.select-items div');
    if (!face) return;

    const idx = select.selectedIndex >= 0 ? select.selectedIndex : 0;
    face.textContent = select.options[idx]?.text || '';

    if (items && items.length) {
	items.forEach((el, i) => {el.classList.toggle('is-active', i === idx);});
    }
};

// custom select for task
// --- Custom Select for #language-select ---
(function initCustomSelectTask() {
    const wrap = document.getElementById('task-select-wrapper');
    if (!wrap) return;                           // HTML wrapper required
    const select = wrap.querySelector('select');
    if (!select) return;

    // Build visible UI
    const face = document.createElement('div');
    face.className = 'select-selected';
    face.setAttribute('tabindex', '0');
    face.setAttribute('role', 'combobox');
    face.setAttribute('aria-expanded', 'false');
    face.setAttribute('aria-haspopup', 'listbox');
    face.textContent = select.options[select.selectedIndex]?.text ?? '';

    const panel = document.createElement('div');
    panel.className = 'select-items';
    panel.setAttribute('role', 'listbox');

    const items = [...select.options].map((opt, idx) => {
	const item = document.createElement('div');
	item.textContent = opt.text;
	item.setAttribute('role', 'option');
	if (idx === select.selectedIndex) item.classList.add('is-active');
	item.addEventListener('mouseenter', () => setActive(idx));
	item.addEventListener('click', () => commitSelection(idx));
	panel.appendChild(item);
	return item;
    });

    wrap.append(face, panel);

    let activeIndex = select.selectedIndex;

    function setActive(i) {
	if (i < 0) i = items.length - 1;
	if (i >= items.length) i = 0;
	items.forEach(n => n.classList.remove('is-active'));
	items[i].classList.add('is-active');
	activeIndex = i;
	items[i].scrollIntoView({ block: 'nearest' });
    }

    function openDropdown() {
	wrap.classList.add('open');
	face.setAttribute('aria-expanded', 'true');
	setActive(select.selectedIndex);
    }

    function closeDropdown() {
	wrap.classList.remove('open');
	face.setAttribute('aria-expanded', 'false');
    }

    function commitSelection(i) {
	if (i !== select.selectedIndex) {
	    select.selectedIndex = i;
	    // Update visible text and fire a native change so your existing code runs
	    face.textContent = select.options[i]?.text ?? '';
	    select.dispatchEvent(new Event('change', { bubbles: true }));
	}
	closeDropdown();
    }

    // Mouse toggle
    face.addEventListener('click', (e) => {
	e.stopPropagation();
	wrap.classList.contains('open') ? closeDropdown() : openDropdown();
    });

    // Keyboard on the face
    face.addEventListener('keydown', (e) => {
	const open = wrap.classList.contains('open');
	if ((e.key === 'Enter' || e.key === ' ') && !open) { e.preventDefault(); openDropdown(); return; }
	if (!open) return;
	if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
	else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
	else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
	else if (e.key === 'End') { e.preventDefault(); setActive(items.length - 1); }
	else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commitSelection(activeIndex); }
	else if (e.key === 'Escape') { e.preventDefault(); closeDropdown(); }
    });

    // Keep UI in sync if code changes the native select
    select.addEventListener('change', () => {
	const i = select.selectedIndex;
	face.textContent = select.options[i]?.text ?? '';
	items.forEach(n => n.classList.remove('is-active'));
	items[i]?.classList.add('is-active');
    });

    // Close on outside click
    document.addEventListener('click', closeDropdown);

    
})();


// === Generic File Upload Handler ===

/**
 * Handles file selection and routes content to the correct pane based on the button clicked.
 * @param {HTMLElement} btn The button that was clicked.
 */
function initializeFileUploader(btn) {
    if (!btn) return;

    btn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        // Allow all file types (code or text)
	input.accept = '.cpp,.cc,.cxx,.java,.py,.txt,.in';
        input.style.display = 'none';

        input.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result ?? "";
                const targetPane = btn.closest('#left-pane') ? 'editor' : 
                      btn.closest('#pane-rtop') ? 'input' : null;

                if (!targetPane) return; // Safety check

                // --- 1. HANDLE INPUT PANE UPLOAD ---
                if (targetPane === 'input') {
                    const inputEl = document.getElementById('stdin-input');

                    // Confirm before overwriting input
                    if (inputEl.value.trim() !== "") {
                        if (!confirm(`Replace current input with contents of "${file.name}"?`)) return;
                    }
                    
                    inputEl.value = text;
		    scheduleSaveSnapshot();	
                    return;
                }

                // --- 2. HANDLE EDITOR PANE UPLOAD (Existing Logic) ---
                
                // Confirm before overwriting existing code
                const current = (window.editor?.getValue() || "").trim();
                if (current && !Object.values(templates).map(v=>v.trim()).includes(current)) {
                    if (!confirm(`Replace current code with contents of "${file.name}"?`)) return;
                }

                // Detect language by extension 
                const ext = file.name.split('.').pop().toLowerCase();
                let lang = null;
                if (['cpp','cc','cxx'].includes(ext)) lang = 'cpp';
                else if (ext === 'java') lang = 'java';
                else if (ext === 'py') lang = 'python';

                // Programmatic language change (from upload): do NOT inject template (keep uploaded code)
                if (lang) {
                    window.setLanguageProgrammatic?.(lang, { injectTemplate: false });
                }

                // Now safely set the uploaded text (template won’t overwrite it)
                window.editor.setValue(text || "" );
		scheduleSaveSnapshot();	
            };

            reader.readAsText(file);
        });

        document.body.appendChild(input);
        input.click();
        input.remove();
    });
}

// === Initialize both buttons ===
(function initUpload() {
    // Editor Pane Button
    const editorBtn = document.getElementById('upload-btn');
    initializeFileUploader(editorBtn);

    // Input Pane Button
    const inputBtn = document.getElementById('upload-input-btn');
    initializeFileUploader(inputBtn);
})();

// Deprecated wrapper kept for compatibility; route to programmatic API
function setLanguage(lang, { skipTemplate = true } = {}) {
    // skipTemplate=true  -> injectTemplate=false
    // skipTemplate=false -> injectTemplate=true
    return window.setLanguageProgrammatic?.(lang, { injectTemplate: !skipTemplate }) || false;
}

/**
 * Replaces characters that have special meaning in HTML with their entity equivalents.
 * This prevents the output text from being rendered as HTML, mitigating XSS risks.
 * * @param {string} unsafeText The raw text output from the compiled program.
 * @returns {string} The safe, escaped HTML string.
 */
function escapeHtml(unsafeText) {
    if (typeof unsafeText !== 'string') {
        unsafeText = String(unsafeText);
    }
    return unsafeText.replace(/[&<>"']/g, function(match) {
        switch (match) {
        case '&':
            return '&amp;';
        case '<':
            return '&lt;';
        case '>':
            return '&gt;';
        case '"':
            return '&quot;';
        case "'":
            return '&#39;';
        default:
            return match;
        }
    });
}


// ===== Run / Status bar (cooldown starts at RUN CLICK) =====


function getCurrentTaskId() {
    return window.currentTask || null;
}

// Send status to the per-tab store in status.js.
// If tabId isn't passed, use the currently active tab.
function setStatusLabel(text, { spinning = false, tabId } = {}) {
    const id = tabId || window.currentTask || null;
    if (!id) return;
    window.App?.Status?.set(id, text || 'Inativo', { spinning });
}



const POLLING_INTERVAL_MS = 5000; // Poll every 2 seconds

/**
 * Polls the CMS server for the status of a test execution until completion.
 * @param {string} testId The ID returned by cmsTest.
 */

function displayStdout(head, str) {
    const theme = getGlobalTheme();
    const color = theme === 'light' ? colorInfoTextLight : colorInfoTextDark;
    let tmp = formatOutput(head, color);
    if (str == "") {
	tmp += formatOutput("O programa não gerou saída.\n", color);
    }
    else {
	tmp += formatOutput("Saída produzida:", color);
	tmp += "<pre>" + str + "</pre>";
    }
    displayProgramOutput(tmp);
}

function displayStderr(head, str) {
    const theme = getGlobalTheme();
    const color = theme === 'light' ? colorInfoTextLight : colorInfoTextDark;
    let tmp = formatOutput(head, color);
    if (str != "") {
	tmp += formatOutput("Mensagens de erro:", color);
	tmp += '<pre class="error">' +str + "</pre>";
	displayProgramOutput(tmp);
    }
}

async function pollTestStatus(testId) {
    // Reference the output pane container
    const outputContainer = document.getElementById('stdout-output');

    const label = getTabTitle(runningTaskId);
    const theme = getGlobalTheme();
    const colorInfoText = theme === 'light' ? colorInfoTextLight : colorInfoTextDark;
    
    // Define the polling loop function
    const checkStatus = async () => {
	const COMPILING = 1;
	const COMPILATION_FAILED = 2;
	const EVALUATING = 3;
	const EVALUATED = 4;

        try {
            const result = await cmsTestStatus(runningTaskId, testId);
            const { status, status_text, compilation_stdout, compilation_stderr, execution_stderr, execution_time, memory, output } = result;
	    let theOutput = output?.replace(new RegExp(escapeRegex(CMS_TASK_NAME), 'g'), label) || "";
	    let theExecution_stderr = execution_stderr?.replace(new RegExp(escapeRegex(CMS_TASK_NAME), 'g'), label) || "";
	    let theCompilation_stderr = compilation_stderr?.replace(new RegExp(escapeRegex(CMS_TASK_NAME), 'g'), label) || "";
	    let theCompilation_stdout = compilation_stdout?.replace(new RegExp(escapeRegex(CMS_TASK_NAME), 'g'), label) || "";

            if (status == EVALUATED) {
                // 1. STOP POLLING
                clearInterval(window.currentTestInterval);
                delete window.currentTestInterval; // Clean up the interval reference
                // 2. DISPLAY FINAL RESULTS
		var program_output = "";
		if (status_text == "Execution completed successfully") {
		    displayStdout("Execução terminou sem erros. ", theOutput);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terminou sem erros", { spinning: false, tabId: runningTaskId });
		}
		else if (status_text == "Execution timed out" || status_text === "Execution timed out (wall clock limit exceeded)") {
		    displayStdout("Execução interrompida por limite de tempo excedido. ", theOutput);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terminou com erro", { spinning: false, tabId: runningTaskId });
		}
		else if (status_text == "Memory limit exceeded") {
		    displayStdout("Execução interrompida por limite de memória excedido. ", theOutput);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terminou com erro", { spinning: false, tabId: runningTaskId });
		}
		else if (status_text == "Execution killed by signal" || status_text == "Execution failed because the return code was nonzero") {
		    displayStderr("Execução interrompida por erro de execução. ", theExecution_stderr);
		    displayStdout("", theOutput);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terminou com erro", { spinning: false, tabId: runningTaskId });
		}
		else {
		    displayStderr("Execução interrompida por erro de execução. ", execution_stderr);
		    displayStdout("", theOutput);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terminou com erro", { spinning: false, tabId: runningTaskId });
		} 
		markRunComplete();

	    } else if (status == COMPILATION_FAILED) {
                // 1. STOP POLLING
                clearInterval(window.currentTestInterval);
                delete window.currentTestInterval; // Clean up the interval reference
                // 2. DISPLAY FINAL RESULTS
		var program_output = formatOutput("\nErro de compilação:\n", colorInfoText);
		if (theCompilation_stdout != "")
		    program_output += '<pre class="error">' + theCompilation_stdout + "</pre>" , "red";
		if (theCompilation_stderr != "")
		program_output += '<pre class="error">'  + theCompilation_stderr + "</pre>", "red";
                displayProgramOutput(program_output);
		setStatusLabel(`${ status_text }`, { spinning: false, tabId: runningTaskId });
		markRunComplete();
            } else if (status == 1|| status == 3) {
                // CONTINUE POLLING (Interval handles the next call)
		setStatusLabel(`${ status_text }`, { spinning: true, tabId: runningTaskId });
            } else { 
                // 1. STOP POLLING
                clearInterval(window.currentTestInterval);
                delete window.currentTestInterval;
		displayStderr("Execução interrompida por erro de execução. ", theExecution_stderr);
		displayStdout("", theOutput);
		program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                displayProgramOutput(program_output);
		setStatusLabel("Execução terminou com erro", { spinning: false, tabId: runningTaskId });
		markRunComplete();
            }

        }
	catch (error) {
	    console.error("erro cms:", error);
            clearInterval(window.currentTestInterval);
            delete window.currentTestInterval;
	    displayStderr("Erro de processamento. ", "");
	    setStatusLabel("Execução terminou com erro", { spinning: false, tabId: runningTaskId });
	    markRunComplete();
        }
    };

    // Start the interval and save its ID so we can stop it later
    // We run checkStatus immediately once, and then start the interval
    await checkStatus(); 
    window.currentTestInterval = setInterval(checkStatus, POLLING_INTERVAL_MS);
}

function displayProgramOutput(programOutputText) {
    setOutputForTab(runningTaskId, programOutputText, { append: true });
}

function formatOutput(str, textColor="") {
    if (typeof str !== 'string') {
        str = String(str);
    }
    
    const htmlContent = str.replace(/\n/g, '<br/>');
    const styledHtml = `<span style="color: ${textColor || 'inherit'};">${htmlContent}</span>`;

    return styledHtml;
}

function getLocalizedTime(locale = 'pt-BR') {
    const now = new Date();
    
    // Uses the user's local settings (or 'en-US' if specified)
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

    const formattedTime = now.toLocaleTimeString(locale, timeOptions);
    return formattedTime
}

function readCurrentPanes() {
    return {
	code: window.editor?.getValue?.() || "",
	input: document.getElementById("stdin-input")?.value || "",
	output: document.getElementById("stdout-output")?.innerHTML || "",
	language: document.getElementById("language-select")?.value || ""
    };
}

function scheduleSaveSnapshot() {
    if (_suppressSnapshot) return;
    const tabId = window.currentTask;
    if (!tabId) return;
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
	try {
	    const old = loadTabSnapshot(tabId) || { id: tabId, title: tabId };
	    const snap = { ...old, ...readCurrentPanes() };
	    saveTabSnapshot(tabId, snap);
	    //checkStorageQuotaAndWarn?.();
	} catch (e) {
	    console.warn("saveSnapshot failed:", e);
	    alert("Armazenamento local está cheio. Limpe espaço e tente de novo.");
	}
    }, 400);
}



// Debounced saver
window._saveTimer = null;

// Editor changes
if (window.editor?.onDidChangeModelContent) {
    window.editor.onDidChangeModelContent(() => scheduleSaveSnapshot());
}

// Stdin textarea changes
const _stdin = document.getElementById("stdin-input");
if (_stdin) _stdin.addEventListener("input", scheduleSaveSnapshot);


window._suppressSnapshot = false;

function loadTabIntoUI(tabId) {
    const snap = loadTabSnapshot(tabId);
    if (!snap) return;

    window.currentTask = tabId; // for reuse of existing code paths

    // language (programmatic — DO NOT inject template)
    const lang = snap.language || "cpp";
    if (window.setLanguageProgrammatic) {
	window.setLanguageProgrammatic(lang, { injectTemplate: false });
    } else {
	const sel = document.getElementById("language-select");
	if (sel) {
	    const idx = Array.from(sel.options).findIndex(o => o.value === lang);
	    if (idx !== -1) {
		sel.selectedIndex = idx;
		// ensure Monaco mode switches but not template
		monaco.editor.setModelLanguage(window.editor.getModel(), lang);
		window.syncLanguageSelectorUI?.();
	    }
	}
    }

    // Notify LSP of new document content
    if (window.editor) {
        const model = window.editor.getModel();
        // LSP will automatically track the new content via didChange events
    }

    
    // code
    window.editor?.setValue?.(snap.code || "");

    // input
    const stdin = document.getElementById("stdin-input");
    if (stdin) {
	stdin.value = snap.input || "";
	stdin.scrollTo({ top: stdin.scrollHeight, behavior: "smooth" });
    }

    // output (and seed buffer)
    const out = document.getElementById("stdout-output");
    if (out) {
	out.innerHTML = snap.output || "";
	out.scrollTo({ top: out.scrollHeight, behavior: "smooth" });
    }
    _outputBuffers[tabId] = snap.output || "";

    applyGlobalTheme(getGlobalTheme())

    // status footer (if you show tab name there)
    document.getElementById("status-task")?.replaceChildren(document.createTextNode(snap.title || tabId));

    // remember
    setLastTab(tabId);

    window.App?.Status?.renderFor(tabId);
    
    // focus editor
    setTimeout(() => window.editor?.focus?.(), 80);
}


// ---- First-load boot for tarefa11 ----
window.__initialTaskBootDone = false;

async function initFirstTabIfNeeded() {
    // 1) If there is an index, use it; else try to migrate tarefa* → tabs
    let tabs = readTabsIndex();

    if (!tabs.length) {
	
	const tabId = makeTabIdFromTitle("Tarefa");
	writeTabsIndex([tabId]);
	saveTabSnapshot(tabId, {
            id: tabId,
            title: "Tarefa",
            language: "cpp",
            code: window.templates?.cpp || "",
            input: "",
            output: ""
	});
	tabs = [tabId];
    }

    // 2) Render the tabs bar
    const last = getLastTab();
    const active = (last && tabs.includes(last)) ? last : tabs[0];
    renderTabs(active);
    loadTabIntoUI(active);
}


// --- Per-task output buffers ---
const _outputBuffers = Object.create(null); // { taskId: htmlString }


// Save only the output for a given task snapshot
function persistTabOutput(tabId, htmlOutput) {
    if (!tabId) return;

    // Always use your snapshot helpers (they handle the correct storage key)
    let snap = loadTabSnapshot(tabId);

    // If there’s no snapshot yet, seed a minimal one without clobbering defaults
    if (!snap) {
	snap = {
	    id: tabId,
	    title: (typeof getTabTitle === 'function' && getTabTitle(tabId)) || tabId,
	    language: document.getElementById('language-select')?.value || 'cpp',
	    code: '',   // leave code/input empty; we’re only ensuring the object exists
	    input: '',
	    output: ''
	};
    }

    // Update only the output field
    snap.output = htmlOutput;

    try {
	saveTabSnapshot(tabId, snap);
    } catch (e) {
	console.warn('persistTabOutput failed:', e);
	// Optional: alert the user if storage is full
	// alert('Falha ao salvar a saída (armazenamento local está cheio).');
    }
}

// Unified setter (append or replace) that targets a specific task
function setOutputForTab(taskId, htmlChunk, { append = true } = {}) {
    if (!taskId) return;

    const prev = _outputBuffers[taskId] || "";

    const next = append ? prev + htmlChunk : htmlChunk;
    _outputBuffers[taskId] = next;

    // If the user is viewing this task, also update the DOM
    if (window.currentTask === taskId) {
	const out = document.getElementById('stdout-output');
	if (out) {
	    out.innerHTML = next;
	    out.scrollTo({ top: out.scrollHeight, behavior: "smooth" });
	}
    }

    // Persist snapshot for THAT tab (not the current one)
    persistTabOutput(taskId, next);
}


// Maps your select values to Monaco language ids.
const langMap = { cpp: 'cpp', java: 'java', python: 'python' };



// Render tabs

function renderTabs(activeId) {
    const tabs = readTabsIndex();
    const bar = document.getElementById('tabs-bar');
    if (!bar) return;
    bar.innerHTML = "";

    tabs.forEach((tid) => {
	const snap = loadTabSnapshot(tid) || { id: tid, title: tid };
	const btn = document.createElement("button");
	btn.type = "button";
	btn.className = "tab";
	btn.setAttribute("role", "tab");
	btn.setAttribute("aria-selected", String(tid === activeId));
	btn.dataset.tabId = tid;
	btn.innerHTML = `
  <span class="tab-title">${escapeHtml(snap.title || tid)}</span>
  ${runningTaskId === tid ? `<span class="tab-spinner" aria-hidden="true"></span>` : ''}
  <span class="tab-close" title="Fechar" aria-label="Fechar">✕</span>
`;
	btn.addEventListener("click", (e) => {
	    const close = e.target.closest(".tab-close");
	    if (close) {
		e.stopPropagation();
		closeTab(tid);
		return;
	    }
	    setLastTab(tid);
	    renderTabs(tid);
	    loadTabIntoUI(tid);
	});
	btn.addEventListener("dblclick", () => renameTab(tid));
	bar.appendChild(btn);
    });
}

window.onbeforeunload = function (e) {
    // warn on closing
    if (true) {
	e.preventDefault();
	e.returnValue = '';
	return '';
    }
};

// Cooldown
const COOLDOWN_MS = 10_000;
const LS_STATUS = 'run:status';       // "running" | null
const LS_LAST   = 'run:lastStartMs';  // epoch ms

// --- boot: if a run was in progress, restart a fresh 30s on reload
(function bootCooldown() {
    if (localStorage.getItem(LS_STATUS) === 'running') {
	localStorage.setItem(LS_LAST, String(Date.now())); // full 30s after reload
    }
})();

// --- helpers you can call from your code ---
function markRunStart() {
    localStorage.setItem(LS_STATUS, 'running');
    localStorage.setItem(LS_LAST, String(Date.now()));
}

function markRunComplete() {
    localStorage.removeItem(LS_STATUS);
    scheduleSaveSnapshot();
    setRunningTab(null);                      // remove spinner
    runningTaskId = null;		    
    // keep LS_LAST so cooldown check can still apply if you want
}

function cooldownLeft() {
    const last = Number(localStorage.getItem(LS_LAST) || 0);
    if (!last) return 0;
    const msLeft = last + COOLDOWN_MS - Date.now();
    return Math.max(0, Math.ceil(msLeft / 1000));
}

function stopCooldownTicker() {
    if (cooldownTimerId) {
	clearInterval(cooldownTimerId);
	cooldownTimerId = null;
    }
}
function startCooldownTicker() {
    // avoid duplicates
    stopCooldownTicker();
    cooldownTimerId = setInterval(() => {
	if (cooldownLeft() === 0) {
	    stopCooldownTicker();
	}
    }, 1000);
}

// ====  Tabs  ====
// === Dynamic Tabs (storage keys) ===
const TABS_INDEX_KEY = "obi:tabs:index:v1";   // array of tabIds, in order
const LAST_TAB_KEY   = "obi:lastTabId";       // active tab id
const SNAP_PREFIX    = "obi:tab:v1:";         // per-tab snapshot key prefix
const PRUNE_PREFIXES = [SNAP_PREFIX];

function tabStorageKey(tabId) { return `${SNAP_PREFIX}${tabId}`; }

function readTabsIndex() {
  const bbb = localStorage.getItem(TABS_INDEX_KEY);
    const ddd = bbb ? JSON.parse(bbb) : null;
  try {
    const raw = localStorage.getItem(TABS_INDEX_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeTabsIndex(list) {
  try { localStorage.setItem(TABS_INDEX_KEY, JSON.stringify(list)); } catch {}
}

function saveTabSnapshot(tabId, snap) {
    try { localStorage.setItem(tabStorageKey(tabId), JSON.stringify(snap)); } catch {}
    pruneOldest();
}

function loadTabSnapshot(tabId) {
  try {
    const raw = localStorage.getItem(tabStorageKey(tabId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Global: remember active tab
function setLastTab(tabId) { try { localStorage.setItem(LAST_TAB_KEY, tabId); } catch {} }
function getLastTab() { try { return localStorage.getItem(LAST_TAB_KEY) || null; } catch { return null; } }

function makeTabIdFromTitle(title) {
  // unique-ish id: sanitized title + timestamp
  const base = String(title || "tab")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "tab";
  return `${base}-${Date.now().toString(36)}`;
}

function newTab(initialTitle = "") {
    const title = initialTitle || prompt("Nome da nova aba:", "Tarefa");
    if (!title) return;

    const tabId = makeTabIdFromTitle(title);
    const tabs = readTabsIndex();
    tabs.push(tabId);
    writeTabsIndex(tabs);

    const lang = document.getElementById("language-select")?.value || "cpp";
    const initSnap = {
	id: tabId,
	title: title,
	language: lang,
	code: window.templates?.[lang] || "",
	input: "",
	output: ""
    };
    saveTabSnapshot(tabId, initSnap);

    renderTabs(tabId);       // selects new tab
    loadTabIntoUI(tabId);    // sets editor/input/output


}

function renameTab(tabId) {
    const snap = loadTabSnapshot(tabId);
    if (!snap) return;
    const next = prompt("Renomear aba:", snap.title || "");
    if (!next || next === snap.title) return;
    snap.title = next;
    saveTabSnapshot(tabId, snap);
    renderTabs(tabId);
}

function closeTab(tabId) {
    const tabs = readTabsIndex();
    const idx = tabs.indexOf(tabId);
    if (idx < 0) return;
    if (!confirm("Fechar esta aba? O código, a entrada e a saída serão descartados e não será possível recuperá-los.")) return;

    if (tabId === runningTaskId) setRunningTab(null);
    
    // Remove snapshot and id
    try { localStorage.removeItem(tabStorageKey(tabId)); } catch {}
    tabs.splice(idx, 1);
    writeTabsIndex(tabs);

    // Choose next active
    const nextActive = tabs[idx] || tabs[idx - 1] || tabs[0] || null;
    renderTabs(nextActive);
    if (nextActive) loadTabIntoUI(nextActive);
    else { // no tabs → create one
	newTab("Tarefa");
    }
}

// pruning
const MAX_BYTES = 5 * 1024 * 1024;     // ~5 MB hard cap
const PRUNE_THRESHOLD = 4 * 1024 * 1024; // start pruning above 4 MB
const TARGET_AFTER_PRUNE = 3.5 * 1024 * 1024; // stop once below this

function byteLen(str) {
    try { return new TextEncoder().encode(String(str)).length; }
    catch { return String(str).length * 2; }
}

function usageBytes() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
	const k = localStorage.key(i);
	const v = localStorage.getItem(k);
	total += byteLen(k) + byteLen(v);
    }
    return total;
}

function getCandidateKeys() {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
	const key = localStorage.key(i);
	if (!key) continue;
	if (PRUNE_PREFIXES.some(p => key.startsWith(p))) {
            try {
		const item = JSON.parse(localStorage.getItem(key));
		const ts = item?._lastAccess || 0;
		list.push({ key, ts });
            } catch {
		list.push({ key, ts: 0 });
            }
	}
    }
    return list;
}

function pruneOldest() {
    let used = usageBytes();
    if (used < PRUNE_THRESHOLD) return;

    const candidates = getCandidateKeys().sort((a, b) => a.ts - b.ts);
    console.warn(`[OBI Storage] usage ${Math.round(used / 1024)} KB; pruning…`);

    for (const c of candidates) {
	localStorage.removeItem(c.key);
	used = usageBytes();
	if (used < TARGET_AFTER_PRUNE) break;
    }

    console.info(`[OBI Storage] pruned; new usage ${Math.round(used / 1024)} KB`);
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} str The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegExp(str) {
  // $& means the whole matched string
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces all occurrences of a specific color value within the inline style="color: ..." 
 * attributes of an element's inner HTML.
 *
 * @param {HTMLElement} element The container element to search within.
 * @param {string} oldColor The color to replace (e.g., 'red', '#FF0000', 'rgb(255, 0, 0)').
 * @param {string} newColor The new color to substitute.
 */
function replaceColor(element, oldColor, newColor) {
  if (!element || typeof element.innerHTML !== 'string') {
    console.error("Invalid element provided to replaceColor function.");
    return;
  }

  // Escape the old color string to safely use it in a regular expression.
  const escapedOldColor = escapeRegExp(oldColor);

  // This regex finds "color:", allows for any whitespace, and then matches the old color.
  // It's global ('g') to replace all instances and case-insensitive ('i').
  // The first part (color:\s*) is captured so we can preserve original whitespace.
  const regex = new RegExp(`(color\\s*:\\s*)${escapedOldColor}`, 'gi');

  const oldHtml = element.innerHTML;
  const newHtml = oldHtml.replace(regex, `$1${newColor}`);

  // Only update the DOM if a change was actually made.
  if (oldHtml !== newHtml) {
    element.innerHTML = newHtml;
  }
}

/**
 * Remove all HTML tags from a string, replacing <br> or <br/> with newline characters.
 * @param {string} content - The HTML string.
 * @returns {string} The plain text string with <br> converted to "\n".
 */
function removeHtmlTags(content) {
  if (typeof content !== 'string') return '';

  // Normalize <br> tags to a placeholder newline
  let text = content.replace(/<br\s*\/?>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<\/?[^>]+(>|$)/g, '');

  // Decode basic HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text.trim();
}

/**
 * Get the title of a tab/task from localStorage
 * @param {string} tabId - The internal ID of the tab (e.g. "tarefa1-abc123")
 * @returns {string|null} The stored title, or null if not found
 */
function getTabTitle(tabId) {
  if (!tabId) return null;
  const key = `${SNAP_PREFIX}${tabId}`; // same prefix as your tab storage
  try {
      const raw = localStorage.getItem(key);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    return snap?.title || null;
  } catch (e) {
    return null;
  }
}

function removeString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a) return b;
  const idx = b.indexOf(a);
  if (idx === -1) return b;
  return b.slice(0, idx) + b.slice(idx + a.length);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// runningTaskId already exists in your code; we’ll just manipulate it.
function setRunningTab(tabIdOrNull) {
  const prev = runningTaskId || null;
  runningTaskId = tabIdOrNull || null;
  // Update the previous and the new tab buttons
  updateTabSpinnerFor(prev);
  updateTabSpinnerFor(runningTaskId);
}

function updateTabSpinnerFor(tabId) {
  if (!tabId) return;
  const btn = document.querySelector(`.tabs-bar .tab[data-tab-id="${CSS.escape(tabId)}"]`);
  if (!btn) return;

  let sp = btn.querySelector('.tab-spinner');

  if (runningTaskId === tabId) {
    // ensure spinner exists
    if (!sp) {
      sp = document.createElement('span');
      sp.className = 'tab-spinner';
      sp.setAttribute('aria-hidden', 'true');
      const close = btn.querySelector('.tab-close');
      if (close) btn.insertBefore(sp, close); else btn.appendChild(sp);
    }
  } else {
    // ensure spinner is removed
    if (sp) sp.remove();
  }
}

// === Global Theme (applies to all tasks) ===
const THEME_KEY = "obi:globalTheme"; // 'light' | 'dark'

function getGlobalTheme() {
  try { return localStorage.getItem(THEME_KEY) || "light"; } // default = light
  catch { return "light"; }
}

function setGlobalTheme(mode /* 'light'|'dark' */) {
  try { localStorage.setItem(THEME_KEY, mode); } catch {}
  applyGlobalTheme(mode);
}

function initGlobalTheme() {
  const mode = getGlobalTheme();
  // Apply immediately for panes and document
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


(function (window, document) {
  "use strict";
  window.App = window.App || {};

  // In-memory cache: taskId -> { text, spinning }
  const map = new Map();

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
    return map.get(taskId) || loadFromStorage(taskId) || { text: "Inativo", spinning: false };
  }

  function set(taskId, text, { spinning = false } = {}) {
    if (!taskId) return;
    const payload = { text, spinning };
    map.set(taskId, payload);
    saveToStorage(taskId, payload);
    if (taskId === window.currentTask) renderFor(taskId);
  }

  function clear(taskId) {
    if (!taskId) return;
    map.delete(taskId);
    removeFromStorage(taskId);
    if (runningTaskId === window.currentTask) renderFor(taskId);
  }

  function clearAll() {
    // remove all keys with our prefix
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
    map.clear();
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

