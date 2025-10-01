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
	// Initial State for Task 1
	task1: {
            code: window.templates.cpp,
            language: 'cpp',
            input: 'Task 1 default input data.',
            output: 'Task 1 default output (logs, hints, etc.).',
            theme: 'dark' // Store the theme preference
	},
	// Initial State for Task 2
	task2: {
            code: window.templates.cpp,
            language: 'cpp',
            input: 'Task 2 default input data.',
            output: 'Task 2 default output (logs, hints, etc.).',
            theme: 'dark' // Store the theme preference
	},
	// Initial State for Task 3
	task3: {
            code: window.templates.cpp,
            language: 'cpp',
            input: 'Task 3 default input data.',
            output: 'Task 3 default output (logs, hints, etc.).',
            theme: 'dark' // Store the theme preference
	}
    };

    window.currentTask = 'task1'; // Default starting task
    
    // Initialize editor
    window.editor = monaco.editor.create(document.getElementById('editor-container'), {
	value: templates.cpp,   // default
	language: 'cpp',
	theme: 'vs-dark',
	automaticLayout: true,
	fontSize: 14,
	minimap: { enabled: false },
	padding: { top: 10 }   // 👈 adds margin on top
    });

    const langMap = { cpp: 'cpp', java: 'java', python: 'python' };

    function setLanguageUI(lang) {
	const wrap   = document.getElementById('language-select-wrapper');
	const select = document.getElementById('language-select');
	if (!wrap || !select) return false;

	const idx = Array.from(select.options).findIndex(o => o.value === lang);
	console.log('setLanguageUI -> lang:', lang, 'idx:', idx,
		    'options:', Array.from(select.options).map(o => o.value));

	if (idx < 0) return false;

	select.selectedIndex = idx;

	const face  = wrap.querySelector('.select-selected');
	const items = wrap.querySelectorAll('.select-items div');
	if (face) face.textContent = select.options[idx].text;
	if (items) items.forEach((el, i) => el.classList.toggle('is-active', i === idx));

	return true;
    }
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
	
	console.log(`State saved for ${taskID}`);
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
	console.log('[loadTaskState] taskID=', taskID);
	console.log('[loadTaskState] state(language, code len, input len)=',
		    window.taskStates[taskID]?.language,
		    window.taskStates[taskID]?.code?.length || 0,
		    window.taskStates[taskID]?.input?.length || 0
		   );
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
	const stdoutOutput = document.getElementById('stdout-output');
	if (stdinInput)   stdinInput.value = state.input  || "";
	if (stdoutOutput) stdoutOutput.innerHTML = state.output || "";

	// Theme for right panes (unchanged)
	const rtopContainer = document.querySelector('#pane-rtop .pane-container');
	const rbotContainer = document.querySelector('#pane-rbot .pane-container');
	const shouldBeLight = state.theme === 'light';
	rtopContainer?.classList.toggle('light-mode', shouldBeLight);
	rbotContainer?.classList.toggle('light-mode', shouldBeLight);

	console.log(`State loaded for ${taskID}`);
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
	}

	// 4) Wire only the editor button; stop the click from reaching other generic handlers
	editorToggleBtn.addEventListener('click', (e) => {
	    e.stopPropagation();
	    e.stopImmediatePropagation();
	    editorDark = !editorDark;
	    applyEditorTheme();
	});

	// 5) If you *also* want to respond to an app-wide theme change, keep this tiny listener.
	//    It toggles the editor only if the event originated INSIDE the left pane.
	document.addEventListener('click', (e) => {
	    const btn = e.target.closest('.style-toggle-btn');
	    if (!btn) return;
	    if (!leftPane.contains(btn)) return; // ignore right-pane toggles
	    // If your app-wide handler already flipped classes, you could sync to them here.
	    // For now we do nothing; editor is driven exclusively by the scoped handler above.
	}, true);

	// 6) Initial paint
	applyEditorTheme();
    })();

    
    // Handle language switch


    document.getElementById('language-select').addEventListener('change', function(e) {
	const lang = e.target.value;
	
	console.log("change in language-select");
	
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
    document.getElementById('run-btn').addEventListener('click', () => {
	const code = window.editor.getValue();
	const stdin = document.getElementById('stdin-input')?.value ?? "";
	console.log("=== Running code ===\n", code);
	console.log("=== With stdin ===\n", stdin);
	alert("Run pressed! (Code + stdin logged in console for now)");
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
	if (confirm("Are you sure you want to clear all code?")) {
	    window.editor.setValue("// Start coding here");
	}
    });    
});


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
    console.log("window.syncLanguageSelectorUI")
  const wrap   = document.getElementById('language-select-wrapper');
  const select = document.getElementById('language-select');
  if (!wrap || !select) return;
    console.log("OK 1");
  const face  = wrap.querySelector('.select-selected');
  const items = wrap.querySelectorAll('.select-items div');
  if (!face) return;

  const idx = select.selectedIndex >= 0 ? select.selectedIndex : 0;
  face.textContent = select.options[idx]?.text || '';

  if (items && items.length) {
      console.log("OK 2, length =",items.length);
      items.forEach((el, i) => {console.log(i,idx,el);el.classList.toggle('is-active', i === idx);});
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

// === Upload file into editor (keeps custom select in sync, no template override) ===
(function initUpload() {
    const btn = document.getElementById('upload-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.cpp,.cc,.cxx,.java,.py,.txt';
	input.style.display = 'none';

	input.addEventListener('change', (event) => {
	    const file = event.target.files?.[0];
	    if (!file) return;

	    const reader = new FileReader();
	    reader.onload = (e) => {
		const text = e.target.result ?? "";

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

		// After detecting the uploaded file's language => lang
		setLanguageUI(lang);                         // DOM sync (face + is-active)
		window.__suppressTemplateOnce = true;        // prevent template overwrite
		document.getElementById('language-select')
		?.dispatchEvent(new Event('change', { bubbles: true }));
		
		// Now safely set the uploaded text (template won’t overwrite it)
		window.editor.setValue(text || "" );

	    };

	    reader.readAsText(file);
	});

	document.body.appendChild(input);
	input.click();
	input.remove();
    });
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

