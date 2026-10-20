import { calculateDuration, timeToSeconds } from "./timecode.js";

/**
 * Builds a clip from selected lines, sorted by transcript position.
 * @param {{ inicio: string, fin: string, transcripcion: string, index: number }[]} lines
 * @param {string} name Falls back to "Untitled Clip" when blank.
 * @param {string} timestamp ISO creation time stored on the clip.
 */
export function buildClip(lines, name, timestamp) {
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
    timestamp,
  };
}

/** First clip, as `{ clip, start }`, beginning after `currentTime + tolerance` seconds, or null. */
export function findNextClipStart(clips, currentTime, tolerance) {
  return sortedStarts(clips).find((c) => c.start > currentTime + tolerance) ?? null;
}

/** Closest clip, as `{ clip, start }`, beginning before `currentTime - tolerance` seconds, or null. */
export function findPrevClipStart(clips, currentTime, tolerance) {
  return sortedStarts(clips).findLast((c) => c.start < currentTime - tolerance) ?? null;
}

function sortedStarts(clips) {
  return clips
    .map((clip) => ({ clip, start: timeToSeconds(clip.inicio) }))
    .sort((a, b) => a.start - b.start);
}
