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
