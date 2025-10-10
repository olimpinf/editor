require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
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
	java: `public class Main {
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

    // Central object to store all task states
    window.taskStates = {
	// Initial State for Tasks
	tarefa1: {
	    title: 'Tarefa 1',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '',
            theme: 'dark'
	},
	tarefa2: {
	    title: 'Tarefa 2',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '',
            theme: 'dark'
	},
	tarefa3: {
	    title: 'Tarefa 3',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '',
            theme: 'dark'
	},
	tarefa4: {
	    title: 'Tarefa 4',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '',
            theme: 'dark'
	},
	tarefa5: {
	    title: 'Tarefa 5',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '',
            theme: 'dark'
	}
    };

    window.currentTask = 'tarefa1'; // Default starting task
    
    // Initialize editor
    window.editor = monaco.editor.create(document.getElementById('editor-container'), {
	value: templates.cpp,   // default
	language: 'cpp',
	theme: 'vs-dark',
	automaticLayout: true,
	fontSize: 14,
	minimap: { enabled: false },
	padding: { top: 10 }  
    });

    initFirstTaskIfNeeded();

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

    function setLanguageUI(lang) {
	const wrap   = document.getElementById('language-select-wrapper');
	const select = document.getElementById('language-select');
	if (!wrap || !select) return false;

	const idx = Array.from(select.options).findIndex(o => o.value === lang);
	if (idx < 0) return false;

	select.selectedIndex = idx;

	const face  = wrap.querySelector('.select-selected');
	const items = wrap.querySelectorAll('.select-items div');
	if (face) face.textContent = select.options[idx].text;
	if (items) items.forEach((el, i) => el.classList.toggle('is-active', i === idx));

	return true;
    }
    
    // --- Handle Task Switch ---
    document.getElementById('task-select')?.addEventListener('change', function(e) {
	const newTaskID = e.target.value;

	// 1. Save the state of the OLD task
	//saveCurrentTaskState();
	//scheduleSaveSnapshot();	
	
	// 2. Load the state of the NEW task
	loadTaskState(newTaskID);
    });


    // Extracted Language Logic Function
    function switchLanguage(lang) {
	const model = window.editor.getModel();
	// This is the core function call to change the syntax highlighting
	monaco.editor.setModelLanguage(model, langMap[lang] || 'plaintext');

    }



    // === Editor-only theme toggle (scoped to LEFT pane) ===
    (function initEditorThemeToggle() {
	if (!window.editor || typeof monaco === 'undefined') return;

	// 1) Find the editor's toggle button *inside* the left pane only
	const leftPane = document.getElementById('left-pane');
	const editorToggleBtn = leftPane?.querySelector('.style-toggle-btn');
	if (!leftPane || !editorToggleBtn) return;

	// 2) Keep a local state so we don't depend on external classes
	//    Start from the current Monaco theme (assume initial 'vs-dark' in your setup)
	let editorDark = true;

	// 3) Apply to Monaco + (optional) reflect to the left pane for consistent visuals
	function applyEditorTheme() {
	    monaco.editor.setTheme(editorDark ? 'vs-dark' : 'vs');
	    leftPane.setAttribute('data-theme', editorDark ? 'dark' : 'light'); // optional
	    leftPane.classList.toggle('theme-dark', editorDark);                // optional
	    leftPane.classList.toggle('theme-light', !editorDark);              // optional
	    const rtopContainer = document.querySelector('#pane-rtop .pane-container');
	    const rbotContainer = document.querySelector('#pane-rbot .pane-container');
	    rtopContainer?.classList.toggle('light-mode', !editorDark);
	    rbotContainer?.classList.toggle('light-mode', !editorDark);
	}

	editorToggleBtn.addEventListener('click', (e) => {
	    editorDark = !editorDark;
	    applyEditorTheme();
	});

	applyEditorTheme();
    })();

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
	const baseFilename = getSanitizedTaskName();
	
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
	const openingTagRegex = /<div.*?>/gi;    
	const closingTagRegex = /<\/div>/gi;
	let cleanedContent = htmlContent.replace(openingTagRegex, '');
        cleanedContent = cleanedContent.replace(closingTagRegex, '');
	const txtContent = cleanedContent.replace(/<br\s*\/?>/gi, '\n');
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
	
	if (window.currentTestInterval) {
            clearInterval(window.currentTestInterval);
            delete window.currentTestInterval;
            console.log("Stopped previous test execution.");
	}
	runningTaskId = getCurrentTaskId()
	const cmsLanguage = {'cpp': "C++20 / g++", 'python': "Python 3 / PyPy", 'java': 'Java / JDK'};
	const cmsExtension = {'cpp': "cpp", 'python': "py", 'java': 'java'};
	const code = window.editor.getValue();
	const input = document.getElementById('stdin-input')?.value ?? "";
	const selectedLanguage = document.getElementById('language-select')?.value ?? "cpp"; // Get language dynamically
	const language = cmsLanguage[selectedLanguage];
	const languageExtension = cmsExtension[selectedLanguage];

	setStatusLabel("Enviando...", { spinning: true });
	const initMessage = "\n" + "<b>" + getLocalizedTime() + "</b>" + ": submissão enviada\n";

	const theme = getTaskTheme(runningTaskId);
	const colorEmphasis = theme === 'light' ? colorEmphasisTextLight : colorEmphasisTextDark;
	
	displayProgramOutput(formatOutput(initMessage, color=colorEmphasis));
	try {
            // Submit the code and get the test ID
            const submissionResult = await cmsTestSend(runningTaskId, code, input, language, languageExtension);
            const testId = submissionResult.data.id;
            
            // Start polling for the status
            await pollTestStatus(testId);

	} catch (error) {
            console.error("CMS Test Submission Failed:", error);
	    setStatusLabel("Submissão falhou", { spinning: false });
            displayProgramOutput(formatOutput("Submissão falhou.", color="red"));
	}
	scheduleSaveSnapshot();	
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
	if (confirm("Tem certeza que deseja limpar a área de código??")) {
	    window.editor.setValue("");
	}
	scheduleSaveSnapshot();	
        //saveCurrentTaskState();
    });    

    // Clear Input button
    document.getElementById('clear-input-btn').addEventListener('click', () => {
	const inputElement = document.getElementById('stdin-input');

	if (inputElement) {
            inputElement.value = "";
	}        
	scheduleSaveSnapshot();	
        //saveCurrentTaskState();
    });    

    // Clear Output button
    document.getElementById('clear-output-btn').addEventListener('click', () => {
	const outputElement = document.getElementById('stdout-output');    
	outputElement.innerHTML = '';
	outputBuffer = '';
	scheduleSaveSnapshot();
    });

    // Font size button
    (function setupFontCycler() {
	const btn = document.getElementById("font-btn");
	if (!btn) return;

	// cycle order: medium (default) → small → large → medium ...
	const sizes = ["medium", "small", "large"];
	const fontMap = { small: 10, medium: 12, large: 14 };
	let idx = 0;

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
    
});

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

    document.addEventListener('click', (e) => {
	const btn = e.target.closest('#global-style-toggle');
	if (!btn) return;

	const now = getCurrentTheme();             // 'light' or 'dark'
	const next = now === 'light' ? 'dark' : 'light';
	setThemeForCurrentTask(next);
    });
    
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
                    //saveCurrentTaskState(); 
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
                //saveCurrentTaskState();
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



function getSanitizedTaskName() {
    const taskSelect = document.getElementById('task-select');
    if (!taskSelect) {
        return 'program'; // Fallback name
    }
    
    // Get the visible text of the currently selected option
    const rawName = taskSelect.options[taskSelect.selectedIndex]?.text ?? 'program';
    
    // Sanitize: replace common separators (spaces, colons, parentheses) with underscores, 
    // and remove any remaining invalid characters.
    let sanitizedName = rawName.replace(/[\s:-]+/g, '_').replace(/[^a-zA-Z0-9_]+/g, '');
    
    // Avoid starting/ending with an underscore and convert to lowercase for consistency
    sanitizedName = sanitizedName.toLowerCase().replace(/^_|_$/g, '');
    
    return sanitizedName || 'program'; // Final fallback
}

// ===== Run / Status bar (cooldown starts at RUN CLICK) =====
const MIN_INTERVAL_MS = 10_000; // adjust per exam

let runInProgress   = false;
let runningTaskId   = null;
let lastRunStartMs  = 0;     // <— from click time
let cooldownTimerId = null;
let colorInfoTextLight = "Blue";
let colorInfoTextDark = "Gold";
let colorEmphasisTextLight = "Green";
let colorEmphasisTextDark = "YellowGreen";

function getCurrentTaskId() {
    return window.currentTask || null;
}
function getTaskLabel(taskId) {
    if (!taskId) return '—';
    return (window.taskStates?.[taskId]?.title) || taskId;
}

function setStatusLabel(text, { spinning = false } = {}) {
    // Keep per-task status and update the DOM for the active task
    if (runningTaskId == getCurrentTaskId()) {
	// update the panel and storage
	const labelEl = document.getElementById('status-label');
	const spinEl  = document.getElementById('status-spinner');
	if (!labelEl || !spinEl) return;
	labelEl.textContent = text;
	spinEl.hidden = !spinning;
    }
    if (window.App && window.App.Status) {
	window.App.Status.set(runningTaskId, text, { spinning });
    }
    
}

function cooldownLeft() {
    if (!lastRunStartMs) return 0;
    const left = MIN_INTERVAL_MS - (Date.now() - lastRunStartMs);
    return Math.max(0, Math.ceil(left / 1000));
}
function canStartRun() {
    return !runInProgress && cooldownLeft() === 0;
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
	if (!runInProgress && cooldownLeft() === 0) {
	    stopCooldownTicker();
	}
	paintStatus(); // repaint while ticking
    }, 1000);
}

function paintStatus() {
    const viewingTask = getCurrentTaskId();

    if (runInProgress) {
	const label = getTaskLabel(runningTaskId);
	setStatusLabel(`Executando — <strong>${label}</strong>`, { spinning: true });
	return;
    }

    // const left = cooldownLeft();
    // if (left > 0) {
    // 	setStatusLabel(`Espera: ${left}s — <strong>${getTaskLabel(viewingTask)}</strong>`, { spinning: false });
    // } else {
    // 	//setStatusLabel(`Inativo — <strong>${getTaskLabel(viewingTask)}</strong>`, { spinning: false });
    // 	setStatusLabel(`Inativo`, { spinning: false });
    // }
}

function disableRunButton(disabled) {
    const btn = document.getElementById('run-btn');
    if (btn) btn.disabled = !!disabled;
}

async function handleRunClick() {
    // Block when not allowed; show why
    if (!canStartRun()) {
	paintStatus(); // will show Running or Cooldown
	return;
    }

    // Start run: mark start time NOW and start cooldown ticker
    lastRunStartMs = Date.now();
    startCooldownTicker();

    runInProgress = true;
    runningTaskId = getCurrentTaskId();
    //disableRunButton(true);
    paintStatus(); // "Running — <task>"

    try {
	// Build payload
	const payload = {
	    taskId: runningTaskId,
	    code: window.editor?.getValue?.() || '',
	    language: document.getElementById('language-select')?.value || 'cpp',
	    input: document.getElementById('stdin-input')?.value || ''
	};

	// TODO: replace with real backend request
	await new Promise(res => setTimeout(res, 1500));

	// Example output update
	//const outEl = document.getElementById('stdout-output');
	//if (outEl) outEl.innerHTML = `<pre>Execution finished for ${getTaskLabel(runningTaskId)}</pre>`;

    } catch (err) {
	console.error('Run error:', err);
	// (We still keep the cooldown from click)
    } finally {
	runInProgress = false;
	runningTaskId  = null;

	// Re-enable Run if cooldown has already expired during the run
	//disableRunButton(!canStartRun());

	paintStatus(); // will show Cooldown or Idle
	// ticker is already running; it will stop itself when cooldown hits 0 and nothing is running
    }
}

// Wire once on load
// (function initRunStatusBar() {
//     const btn = document.getElementById('run-btn');
//     if (btn && !btn.__wired) {
// 	btn.addEventListener('click', handleRunClick);
// 	btn.__wired = true;
//     }
//     paintStatus();
// })();

// Call this at the end of loadTaskState(taskID)
window.onTaskViewChanged = function () {
    paintStatus();
};

const POLLING_INTERVAL_MS = 5000; // Poll every 2 seconds

/**
 * Polls the CMS server for the status of a test execution until completion.
 * @param {string} testId The ID returned by cmsTest.
 */

function displayStdout(head, str) {
    const theme = getTaskTheme(runningTaskId);
    const color = theme === 'light' ? colorInfoTextLight : colorInfoTextDark;
    let tmp = formatOutput(head, color);
    if (str == "") {
	tmp += formatOutput("O programa não gerou saída.\n", color);
    }
    else {
	tmp += formatOutput("Saída produzida:\n---------\n", color);
	tmp += formatOutput(str + "\n");
	tmp += formatOutput("---------\n", color);
    }
    displayProgramOutput(tmp);
}

function displayStderr(head, str) {
    const theme = getTaskTheme(runningTaskId);
    const color = theme === 'light' ? colorInfoTextLight : colorInfoTextDark;
    let tmp = formatOutput(head, color);
    if (str != "") {
	tmp += formatOutput("Mensagens de erro:\n---------\n", color);
	tmp += formatOutput(str + "\n", "red");
	tmp += formatOutput("---------\n", color);
    }
    displayProgramOutput(tmp);
}

async function pollTestStatus(testId) {
    // Reference the output pane container
    const outputContainer = document.getElementById('stdout-output');
    
    const label = getTaskLabel(runningTaskId);
    const theme = getTaskTheme(runningTaskId);
    const colorInfoText = theme === 'light' ? colorInfoTextLight : colorInfoTextDark;
    
    // Define the polling loop function
    const checkStatus = async () => {
	const COMPILING = 1;
	const COMPILATION_FAILED = 2;
	const EVALUATING = 3;
	const EVALUATED = 4;

        if (true) {
            const result = await cmsTestStatus(runningTaskId, testId);
            const { status, status_text, compilation_stdout, compilation_stderr, execution_stderr, execution_time, memory, output } = result;
            if (status == EVALUATED) {
                // 1. STOP POLLING
                clearInterval(window.currentTestInterval);
                delete window.currentTestInterval; // Clean up the interval reference
                // 2. DISPLAY FINAL RESULTS
		var program_output = "";
		if (status_text == "Execution completed successfully") {
		    displayStdout("Execução terminou sem erros. ", output);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terrminou sem erros", { spinning: false });
		}
		else if (status_text == "Execution timed out" || status_text === "Execution timed out (wall clock limit exceeded)") {
		    displayStdout("Execução interrompida por limite de tempo excedido. ", output);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terrminou com erro", { spinning: false });
		}
		else if (status_text == "Memory limit exceeded") {
		    displayStdout("Execução interrompida por limite de memória excedido. ", output);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terrminou com erro", { spinning: false });
		}
		else if (status_text == "Execution killed by signal" || status_text == "Execution failed because the return code was nonzero") {
		    displayStderr("Execução interrompida por erro de execução. ", execution_stderr);
		    displayStdout("", output);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terrminou com erro", { spinning: false });
		}
		else {
		    displayStderr("Execução interrompida por erro de execução. ", execution_stderr);
		    displayStdout("", output);
		    program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                    displayProgramOutput(program_output);
		    setStatusLabel("Execução terrminou com erro", { spinning: false });
		} 
		scheduleSaveSnapshot();
		runningTaskId = null;
	    } else if (status == COMPILATION_FAILED) {
                // 1. STOP POLLING
                clearInterval(window.currentTestInterval);
                delete window.currentTestInterval; // Clean up the interval reference
                // 2. DISPLAY FINAL RESULTS
		var program_output = "\nErro de compilação:\n";
		program_output += "---------\n";
		program_output = formatOutput(program_output, colorInfoText);
		program_output += formatOutput(compilation_stdout, "red");
		program_output += formatOutput(compilation_stderr, "red");
                displayProgramOutput(program_output);
		program_output = "\n---------\n";
		program_output = formatOutput(program_output, colorInfoText);
                displayProgramOutput(program_output);
		setStatusLabel(`${ status_text }`, { spinning: false });
		scheduleSaveSnapshot();
		runningTaskId = null;
            } else if (status == 1|| status == 3) {
                // CONTINUE POLLING (Interval handles the next call)
		setStatusLabel(`${ status_text }`, { spinning: true });
            } else { 
                // 1. STOP POLLING
                clearInterval(window.currentTestInterval);
                delete window.currentTestInterval;
		displayStderr("Execução interrompida por erro de execução. ", execution_stderr);
		displayStdout("", output);
		program_output = formatOutput(`Tempo: ${execution_time} | Memória: ${memory}\n`, colorInfoText);
                displayProgramOutput(program_output);
		setStatusLabel("Execução terrminou com erro", { spinning: false });
		scheduleSaveSnapshot();
		runningTaskId = null;
            }

        }
	// catch (error) {
        //     clearInterval(window.currentTestInterval);
        //     delete window.currentTestInterval;
	//     var program_output = "\nErro de processamento\n";
	//     program_output = formatOutput(program_output, "red");
        //     displayProgramOutput(program_output);
	//     scheduleSaveSnapshot();
	//     runningTaskId = null;
        // }
    };

    // Start the interval and save its ID so we can stop it later
    // We run checkStatus immediately once, and then start the interval
    await checkStatus(); 
    window.currentTestInterval = setInterval(checkStatus, POLLING_INTERVAL_MS);
}

function displayProgramOutput(programOutputText) {
  setOutputForTask(runningTaskId, programOutputText, { append: true });
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
    // If your output is HTML, you can store innerHTML; if it’s plain text, prefer textContent.
    output: document.getElementById("stdout-output")?.innerHTML || "",
    language: document.getElementById("language-select")?.value || ""
  };
}

// Debounced saver
let _saveTimer = null;
// function scheduleSaveSnapshot() {
//     if (_suppressSnapshot) return;
//     if (!window.currentTask) return;
//     clearTimeout(_saveTimer);
//     _saveTimer = setTimeout(() => {
//     saveSnapshot(window.currentTask, readCurrentPanes());
//   }, 400);
// }

function scheduleSaveSnapshot() {
  if (_suppressSnapshot) return;
  if (!window.currentTask) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(storageKey(window.currentTask), JSON.stringify(readCurrentPanes()));
      window.App?.PruneStorage?.pruneOldest();
    } catch (e) {
      // QuotaExceededError or other storage errors
      console.warn("saveSnapshot failed:", e);
      alert(
`Your browser storage for this site is full.
Please clear space, then try again.

Tip: Use the editor's "Clear saved tasks" to remove old snapshots.`
      );
    }
  }, 400);
}



// Editor changes
if (window.editor?.onDidChangeModelContent) {
  window.editor.onDidChangeModelContent(() => scheduleSaveSnapshot());
}

// Stdin textarea changes
const _stdin = document.getElementById("stdin-input");
if (_stdin) _stdin.addEventListener("input", scheduleSaveSnapshot);


let _suppressSnapshot = false;

function loadTaskState(taskID) {
  const state = window.taskStates[taskID];
  const snap = loadSnapshot(taskID);

  window.currentTask = taskID;
  _suppressSnapshot = true; // stop debounced saves during programmatic updates
  const lang = snap?.language;
  if (lang) {
    // Programmatic: set Monaco + select, DO NOT inject template when restoring a task
    if (window.setLanguageProgrammatic) {
      window.setLanguageProgrammatic(lang, { injectTemplate: false });
    } else {
      const sel = document.getElementById("language-select");
      if (sel) {
        const idx = Array.from(sel.options).findIndex(o => o.value === lang);
        if (idx !== -1) {
          sel.selectedIndex = idx;
          switchLanguage(lang);
          window.syncLanguageSelectorUI?.();
        }
      }
    }
  }

  // (B) Code
  window.editor?.setValue?.(snap?.code || "");
  // (C) Input
  const stdin = document.getElementById("stdin-input");
  if (stdin) stdin.value = snap?.input || "";
  // (D) Output
  const out = document.getElementById("stdout-output");
  if (out) out.innerHTML = snap?.output || "";
    if (_outputBuffers[taskID])
	_outputBuffers[taskID] = snap?.output || "";
   
  // Theme: apply for all panes + Monaco
  applyGlobalTheme(state.theme);

  window.currentTask = taskID;
  // Refresh the footer to this task's last known status
  if (window.App && window.App.Status) {
    window.App.Status.renderFor(taskID);
  }

    _suppressSnapshot = false; // re-enable
  //scheduleSaveSnapshot();    // take one clean snapshot for this task
}


// ---- First-load boot for tarefa11 ----
window.__initialTaskBootDone = false;

function initFirstTaskIfNeeded() {
  if (window.__initialTaskBootDone) return;

  const tid = 'tarefa1';
  const key = storageKey(tid);

  // Try snapshot
  let snap = null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) snap = JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read tarefa1 snapshot:', e);
  }

  // Fallback to your default
  const def = window.taskStates?.[tid] || {
    title: 'Tarefa 1',
    code: window.templates?.cpp || '',
    language: 'cpp',
    input: '',
    output: '',
    theme: 'dark'
  };

  // If there was no snapshot, seed it now
  if (!snap) {
    try { localStorage.setItem(key, JSON.stringify(def)); }
    catch (e) { console.warn('Seeding tarefa1 snapshot failed:', e); }
  }

  // Merge snapshot (if any) onto default and update the in-memory state
  const merged = { ...def, ...(snap || {}) };
  if (!window.taskStates) window.taskStates = {};
  window.taskStates[tid] = merged;

  // Load the task into the UI without firing snapshot saves mid-load
  _suppressSnapshot = true;
  loadTaskState(tid);
  _suppressSnapshot = false;

  // Take a clean snapshot and optionally warn about quota
  scheduleSaveSnapshot();

  window.__initialTaskBootDone = true;
}

// --- Per-task output buffers ---
const _outputBuffers = Object.create(null); // { taskId: htmlString }

// Get/seed a snapshot for any task
function ensureSnapshot(taskId) {
  const key = storageKey(taskId);
  let snap = null;
  try {
    const raw = localStorage.getItem(key);
    snap = raw ? JSON.parse(raw) : null;
  } catch {}
  if (!snap) {
    // seed from defaults if available
    snap = (window.taskStates && window.taskStates[taskId])
      ? { ...window.taskStates[taskId] }
      : { title: taskId, code: "", input: "", output: "", language: "" };
    try { localStorage.setItem(key, JSON.stringify(snap)); } catch {}
  }
  return snap;
}

// Save only the output for a given task snapshot
function persistTaskOutput(taskId, htmlOutput) {
  const key = storageKey(taskId);
  const snap = ensureSnapshot(taskId);
  snap.output = htmlOutput;
  try { localStorage.setItem(key, JSON.stringify(snap)); } catch (e) {
    console.warn("persistTaskOutput failed:", e);
  }
  // keep in-memory state in sync if present
  if (window.taskStates?.[taskId]) {
    window.taskStates[taskId].output = htmlOutput;
  }
}

// Unified setter (append or replace) that targets a specific task
function setOutputForTask(taskId, htmlChunk, { append = true } = {}) {
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

  // Persist snapshot for THAT task (not the current one)
  persistTaskOutput(taskId, next);
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

function getCurrentTheme() {
  // Prefer the current task state if present
  const taskId = window.currentTask;
  const state = taskId && window.taskStates ? window.taskStates[taskId] : null;
  if (state?.theme === 'light' || state?.theme === 'dark') {
    return state.theme;
  }
  // Fallback: infer from right-top pane
  const rtop = document.querySelector('#pane-rtop .pane-container');
  const isLight = !!rtop && rtop.classList.contains('light-mode');
  return isLight ? 'light' : 'dark';
}

function getTaskTheme(taskId) {
  // Prefer the current task state if present
  const state = taskId && window.taskStates ? window.taskStates[taskId] : null;
  if (state?.theme === 'light' || state?.theme === 'dark') {
    return state.theme;
  }
  // Fallback: infer from right-top pane
  const rtop = document.querySelector('#pane-rtop .pane-container');
  const isLight = !!rtop && rtop.classList.contains('light-mode');
  return isLight ? 'light' : 'dark';
}

function setThemeForCurrentTask(mode) {
  // Persist in memory & snapshot
  if (window.currentTask && window.taskStates?.[window.currentTask]) {
    window.taskStates[window.currentTask].theme = mode;
  }
  applyGlobalTheme(mode);
  scheduleSaveSnapshot?.();
}

// Maps your select values to Monaco language ids.
const langMap = { cpp: 'cpp', java: 'java', python: 'python' };

function switchLanguage(lang) {
  const model = window.editor?.getModel?.();
  if (model && window.monaco?.editor) {
    window.monaco.editor.setModelLanguage(model, langMap[lang] || 'plaintext');
  }
}
