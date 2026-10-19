export const MIN_SEARCH_LENGTH = 2;

/** Indices of lines whose text contains `term`, ignoring case; empty below the minimum length. */
export function findMatchIndices(lines, term) {
  const needle = term.toLowerCase();
  if (needle.length < MIN_SEARCH_LENGTH) return [];
  const found = [];
  lines.forEach((line, i) => {
    if (line.transcripcion.toLowerCase().includes(needle)) found.push(i);
  });
  return found;
}

/** Splits `text` into plain and matching parts so a template can highlight `term`. */
export function highlightSegments(text, term) {
  if (term.length < MIN_SEARCH_LENGTH) return [{ text, match: false }];
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text
    .split(new RegExp(`(${escaped})`, "gi"))
    .map((part, i) => ({ text: part, match: i % 2 === 1 }))
    .filter((segment) => segment.text !== "");
}
