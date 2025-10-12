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

