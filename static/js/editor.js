require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
    // starter templates
    const templates = {
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

    // Handle language switch
    document.getElementById('language-select').addEventListener('change', function(e) {
	const lang = e.target.value;
	const model = window.editor.getModel();

	// set syntax
	monaco.editor.setModelLanguage(model, langMap[lang] || 'plaintext');

	const currentValue = window.editor.getValue().trim();
	if (currentValue !== "" && !Object.values(templates).map(v=>v.trim()).includes(currentValue)) {
	    if (!confirm("Switching language will replace your current code with a starter template. Continue?")) return;
	}

	window.editor.setValue(templates[lang] || "// Start coding here");
    });

    // Run button
    document.getElementById('run-btn').addEventListener('click', () => {
	const code = window.editor.getValue();
	console.log("=== Running code ===\n", code);
	alert("Run button pressed! (Code logged in console for now)");
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
	if (confirm("Are you sure you want to clear all code?")) {
	    window.editor.setValue("// Start coding here");
	}
    });    
});


(function(){
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


// custom select
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


document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.style-toggle-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      // 1. Go UP to the nearest common ancestor: the element with class 'pane'
	const pane = event.target.closest('.pane');
	console.log("pane", pane);
      if (pane) {
        // 2. Go DOWN to the specific element where the theme should be applied
        //    (the sibling of the bar, which contains the text)
        const contentContainer = pane.querySelector('.pane-container');
	console.log("contentContainer", contentContainer);
        
        // 3. Toggle the 'dark-mode' class on the contentContainer
        if (contentContainer) {
          contentContainer.classList.toggle('light-mode');
        }
      }
    });
  });
});
