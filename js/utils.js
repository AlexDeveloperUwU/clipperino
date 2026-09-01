// Escapes text before it is interpolated into innerHTML templates. Transcript
// text and clip names come from user-imported CSV/JSON files, so they must
// never be treated as trusted markup.
const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}
