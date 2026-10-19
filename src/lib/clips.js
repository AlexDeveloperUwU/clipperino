import { calculateDuration } from "./timecode.js";

/**
 * Builds a clip from selected lines, sorted by transcript position.
 * @param {{ inicio: string, fin: string, transcripcion: string, index: number }[]} lines
 * @param {string} name Falls back to "Untitled Clip" when blank.
 */
export function buildClip(lines, name) {
  const sorted = [...lines].sort((a, b) => a.index - b.index);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const duration = calculateDuration(first.inicio, last.fin);

  return {
    name: name.trim() || "Untitled Clip",
    inicio: first.inicio,
    fin: last.fin,
    duration: duration.formatted,
    totalSeconds: duration.totalSeconds,
    lines: sorted.length,
    transcriptions: sorted,
    timestamp: new Date().toISOString(),
  };
}
