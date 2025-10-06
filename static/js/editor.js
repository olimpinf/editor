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
	task1: {
	    title: 'Tarefa 1',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '<pre></pre>',
            theme: 'dark'
	},
	task2: {
	    title: 'Tarefa 2',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '<pre></pre>',
            theme: 'dark'
	},
	task3: {
	    title: 'Tarefa 3',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '<pre>',
            theme: 'dark'
	},
	task4: {
	    title: 'Tarefa 4',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '<pre>',
            theme: 'dark'
	},
	task5: {
	    title: 'Tarefa 5',
            code: window.templates.cpp,
            language: 'cpp',
            input: '',
            output: '<pre>',
            theme: 'dark'
	}
    };

    window.currentTask = 'Tarefa 1'; // Default starting task
    
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
	saveCurrentTaskState();
	
	// 2. Load the state of the NEW task
	loadTaskState(newTaskID);
    });


    // Extracted Language Logic Function
    function switchLanguage(lang) {
	const model = window.editor.getModel();
	// This is the core function call to change the syntax highlighting
	monaco.editor.setModelLanguage(model, langMap[lang] || 'plaintext');

    }


    function loadTaskState(taskID) {
	const state = window.taskStates[taskID];
	if (!state) return;

	window.currentTask = taskID;
	window.onTaskViewChanged?.();
	// (A) Language FIRST
	if (state.language) setLanguage(state.language, { skipTemplate: true });

	// Update the custom select UI (face + .is-active)
	const ok = setLanguageUI(state.language);
	// Make Monaco match; avoid template overwrite this once
	window.__suppressTemplateOnce = true;
	const select = document.getElementById('language-select');
	if (ok && select) {
	    // Fire change so your existing handlers (including Monaco mode) run
	    select.dispatchEvent(new Event('change', { bubbles: true }));
	}

	// (B) Then code
	window.editor.setValue(state.code || "");

	// Input / Output
	const stdinInput  = document.getElementById('stdin-input');
	if (stdinInput)   stdinInput.value = state.input  || "";

	const stdoutOutput = document.getElementById('stdout-output');
	if (stdoutOutput) {
            stdoutOutput.innerHTML = state.output; 
	}

	// Theme for right panes (unchanged)
	const rtopContainer = document.querySelector('#pane-rtop .pane-container');
	const rbotContainer = document.querySelector('#pane-rbot .pane-container');
	const shouldBeLight = state.theme === 'light';
	rtopContainer?.classList.toggle('light-mode', shouldBeLight);
	rbotContainer?.classList.toggle('light-mode', shouldBeLight);

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
	const preElement = outputContainer?.querySelector('pre');
	
	// Fallback to container's text content if <pre> isn't found
	const content = preElement ? preElement.textContent : (outputContainer?.textContent ?? "");

	downloadContent('saida.txt', content);
    });

    document.getElementById('language-select').addEventListener('change', function(e) {
	const lang = e.target.value;
	
	// Check if the change was programmatic (task switch)
	if (window.__suppressTemplateOnce) {
            window.__suppressTemplateOnce = false;
            // The language model MUST STILL BE UPDATED
	    switchLanguage(lang); // <--- CALL IT HERE
            return; // Skip template replacement
	}
	
	// Manual change: run template confirmation logic
	const currentValue = window.editor.getValue().trim();
	if (currentValue !== "" && !Object.values(templates).map(v=>v.trim()).includes(currentValue)) {
            if (!confirm("Switching language will replace your current code with a starter template. Continue?")) return;
	}
	
	// Update language and load template
	switchLanguage(lang); // <--- CALL IT HERE
	window.editor.setValue(templates[lang] || "// Start coding here");
    });
    
    // Run button
    document.getElementById('run-btn')?.addEventListener('click', async () => { // Make the handler async
	// Clear any previous running tests
	if (window.currentTestInterval) {
            clearInterval(window.currentTestInterval);
            delete window.currentTestInterval;
            console.log("Stopped previous test execution.");
	}
	
	const code = window.editor.getValue();
	const input = document.getElementById('stdin-input')?.value ?? "";
	//const language = document.getElementById('language-select')?.value ?? "cpp"; // Get language dynamically
	const language = "C++20 / g++"

	// Clear output pane and show loading state
	//displayProgramOutput("Submitting code to CMS...");

	console.log("=== Submitting code to CMS ===\n", code);
	const label = getTaskLabel(runningTaskId);
	setStatusLabel(`Enviando - <strong>${label}</strong>`, { spinning: false });
	
	try {
            // 1. Submit the code and get the test ID
            const submissionResult = await cmsTest(code, input, language);
            const testId = submissionResult.data.id;
            
            console.log("Submission successful. Starting polling for ID:", testId);

            // 2. Start polling for the status
            await pollTestStatus(testId);

	} catch (error) {
            console.error("CMS Test Submission Failed:", error);
	    setStatusLabel(`Submissão falhou - <strong>${label}</strong>`, { spinning: false });
            displayProgramOutput("Submissão falhou.", color="red");
	}
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
	if (confirm("Are you sure you want to clear all code?")) {
	    window.editor.setValue("// Start coding here");
	}
        saveCurrentTaskState();
    });    

    // Clear Input button
    document.getElementById('clear-input-btn').addEventListener('click', () => {
	const inputElement = document.getElementById('stdin-input');

	if (inputElement) {
            inputElement.value = "";
	}        
        saveCurrentTaskState();
    });    

    // Clear Output button
    document.getElementById('clear-output-btn').addEventListener('click', () => {
	const outputElement = document.getElementById('stdout-output');    
	outputElement.innerHTML = '';
	outputBuffer = '';

    });

    // Font size button
    document.getElementById('size-btn').addEventListener('click', () => {
	console.log("click on size-btn");
        //saveCurrentTaskState();
    });    


    function saveCurrentTaskState() {
	const taskID = window.currentTask;
	if (!window.taskStates[taskID]) return;
	
	// Save Code and Language
	window.taskStates[taskID].code = window.editor.getValue();
	const langSelect = document.getElementById('language-select');
	if (langSelect) {
	    window.taskStates[taskID].language = langSelect.value;
	}

	// Save Input Pane Content
	window.taskStates[taskID].input = document.getElementById('stdin-input')?.value ?? "";
	
	// Save Output Pane Content (Use innerHTML if it contains rich content)
	window.taskStates[taskID].output = document.getElementById('stdout-output')?.innerHTML ?? "";
	
	// Save Theme State (check the class on the pane-container elements)
	const rtopContainer = document.querySelector('#pane-rtop .pane-container');
	const rbotContainer = document.querySelector('#pane-rbot .pane-container');
	
	// Check if both right panes are set to light mode
	const isLight = rtopContainer?.classList.contains('light-mode') && 
              rbotContainer?.classList.contains('light-mode');
	
	window.taskStates[taskID].theme = isLight ? 'light' : 'dark';
	
    }

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
})();


document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.style-toggle-btn').forEach(button => {
	button.addEventListener('click', (event) => {
	    const btn = event.target.closest('.style-toggle-btn');
	    if (!btn) return;
	    const scope = btn.dataset.scope || '';
	    if (scope === 'pane') {	    
		// 1. Go UP to the nearest common ancestor: the element with class 'pane'
		const pane = event.target.closest('.pane');
		if (pane) {
		    // 2. Go DOWN to the specific element where the theme should be applied
		    //    (the sibling of the bar, which contains the text)
		    const contentContainer = pane.querySelector('.pane-container');
		    
		    // 3. Toggle the 'dark-mode' class on the contentContainer
		    if (contentContainer) {
			contentContainer.classList.toggle('light-mode');
			setTimeout(saveCurrentTaskState, 0); // Save state on the next tick

		    }
		}
	    }
	});
    });
});

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
	input.accept = '.cpp,.cc,.cxx,.java,.py,.txt';
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
                    saveCurrentTaskState(); 
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

                // Sync language select + model, but suppress template injection once
                if (lang) {
                    const selectEl = document.getElementById('language-select');
                    if (selectEl) {
                        window.__suppressTemplateOnce = true;                 // << guard ON (one-shot)
                        selectEl.value = lang;
                        selectEl.dispatchEvent(new Event('change', { bubbles: true })); // updates model + custom face
                    }
                }

                // Now safely set the uploaded text (template won’t overwrite it)
                window.editor.setValue(text || "" );
                saveCurrentTaskState();
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


function setLanguage(lang, { skipTemplate = true } = {}) {
    const selectEl = document.getElementById('language-select');
    if (!selectEl) return false;

    // Find the option: values are "cpp" | "java" | "python"
    const idx = Array.from(selectEl.options).findIndex(o => o.value === lang);
    if (idx < 0) return false;

    if (skipTemplate) window.__suppressTemplateOnce = true;

    const willChange = (selectEl.selectedIndex !== idx);
    selectEl.selectedIndex = idx;

    // Fire change so: Monaco mode, your listeners, and the custom "face" all update
    // (change is synchronous, so handlers run before we return)
    if (willChange) {
	selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
	// If value was already selected, some codebases don't rebroadcast;
	// refresh face + Monaco directly to be extra safe:
	window.syncLanguageSelectorUI?.();
	const model = window.editor?.getModel?.();
	if (model && typeof monaco !== 'undefined') {
	    monaco.editor.setModelLanguage(model, lang);
	}
    }

    return true;
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

function getCurrentTaskId() {
    return window.currentTask || null;
}
function getTaskLabel(taskId) {
    if (!taskId) return '—';
    return (window.taskStates?.[taskId]?.title) || taskId;
}

function setStatusLabel(text, { spinning = false } = {}) {
    const labelEl = document.getElementById('status-label');
    const spinEl  = document.getElementById('status-spinner');
    if (!labelEl || !spinEl) return;
    labelEl.innerHTML = text;
    spinEl.hidden = !spinning;
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
	const outEl = document.getElementById('stdout-output');
	if (outEl) outEl.innerHTML = `<pre>Execution finished for ${getTaskLabel(runningTaskId)}</pre>`;

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
async function pollTestStatus(testId) {
    // Reference the output pane container
    const outputContainer = document.getElementById('stdout-output');
    
    const label = getTaskLabel(runningTaskId);
    
    // Define the polling loop function
    const checkStatus = async () => {
	const COMPILING = 1;
	const COMPILATION_FAILED = 2;
	const EVALUATING = 3;
	const EVALUATED = 4;

        try {
            const result = await cmsTestStatus(testId);
            const { status, status_text, compilation_stderr, execution_time, memory, output } = result;

	    console.log("status",status);
	    console.log("status_text",status_text);
            // Update the status display immediately
            // if (outputContainer) {
            //     // Display the current status text
            //     outputContainer.innerHTML = `<pre>Status: ${status_text} | Time: ${execution_time} | Memory: ${memory}\n\n[Waiting for final output...]</pre>`;
            // }

            if (status == EVALUATED) {
                // 1. STOP POLLING
                clearInterval(window.currentTestInterval);
                delete window.currentTestInterval; // Clean up the interval reference
                // 2. DISPLAY FINAL RESULTS
		var program_output = "Execução terminou sem erros.\nSaída produzida:\n";
		program_output += "---------\n";
		program_output = formatOutput(program_output, "DodgerBlue");
		program_output += formatOutput(output + "\n");
		program_output += formatOutput("---------\n" + `Tempo: ${execution_time} | Memória: ${memory}\n`, "DodgerBlue");
                displayProgramOutput(program_output);
		setStatusLabel(`${ status_text }`, { spinning: false });
		console.log(status_text, execution_time, memory);
                console.log(`Test ID ${testId} completed: Status: ${status_text}`);
	    } else if (status == COMPILATION_FAILED) {
                // 1. STOP POLLING
                clearInterval(window.currentTestInterval);
                delete window.currentTestInterval; // Clean up the interval reference
                // 2. DISPLAY FINAL RESULTS
		var program_output = "Erro de compilação:\n";
		program_output = formatOutput(program_output, "DodgerBlue");
		program_output += formatOutput(compilation_stderr, "red");
                displayProgramOutput(program_output);
		setStatusLabel(`${ status_text }`, { spinning: false });
		console.log(status_text, execution_time, memory);
                console.log(`Test ID ${testId} completed: Status: ${status_text}`);
		
            } else if (status == 1|| status == 3) {
                // CONTINUE POLLING (Interval handles the next call)
                console.log(`Test ID ${testId} status: ${status_text}. Polling again in ${POLLING_INTERVAL_MS / 1000}s...`);
		setStatusLabel(`${ status_text }`, { spinning: true });
            } else { 
                // Handle compilation error, runtime error, or other failure states
                clearInterval(window.currentTestInterval);
                delete window.currentTestInterval;
		setStatusLabel(`Erro - <strong>${label}</strong>`, { spinning: true });		
                displayProgramOutput(output);
		//console.log(status_text, execution_time, memory);
                console.error(`Test ID ${testId} failed: ${status_text}`);
            }

        } catch (error) {
            clearInterval(window.currentTestInterval);
            delete window.currentTestInterval;
            console.error("Error during status polling:", error);
            if (outputContainer) {
                outputContainer.innerHTML = '<pre>Error during polling. Check console.</pre>';
            }
        }
    };

    // Start the interval and save its ID so we can stop it later
    // We run checkStatus immediately once, and then start the interval
    await checkStatus(); 
    window.currentTestInterval = setInterval(checkStatus, POLLING_INTERVAL_MS);
}

function displayProgramOutput(programOutputText) {
    const stdoutOutput = document.getElementById('stdout-output');
    
    // Escape the output text to prevent HTML injection, then wrap it in <pre>
    outputBuffer += programOutputText;
    //stdoutOutput.innerHTML = `<pre>${safeOutput}</pre>`;
    stdoutOutput.innerHTML = `${outputBuffer}`;
    
    // Remember to save the new output to the current task state
    //saveCurrentTaskState(); 
}

function formatOutput(str, textColor="") {
    if (typeof str !== 'string') {
        str = String(str);
    }
    
    const htmlContent = str.replace(/\n/g, '<br/>');
    const styledHtml = `<div style="color: ${textColor || 'inherit'};">${htmlContent}</div>`;

    return styledHtml;
}
    
