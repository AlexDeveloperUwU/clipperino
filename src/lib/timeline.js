import { formatTimeShort, timeToSeconds } from "./timecode.js";

const RULER_STEPS = [1, 5, 10, 30, 60, 300, 600];
const TARGET_PX_PER_STEP = 100;

/**
 * Ruler ticks for a timeline of the given pixel width.
 * @returns {{ left: number, label: string }[]} `left` is a percentage.
 */
export function buildRulerMarks(duration, widthPx) {
  if (!(duration > 0) || !widthPx) return [];
  const rawStep = (TARGET_PX_PER_STEP * duration) / widthPx;
  const step = RULER_STEPS.find((s) => rawStep < s) ?? 600;
  return Array.from({ length: Math.floor(duration / step) + 1 }, (_, i) => ({
    left: ((i * step) / duration) * 100,
    label: formatTimeShort(i * step),
  }));
}

/**
 * Clip blocks positioned on a timeline of `span` seconds.
 * @returns {{ name: string, start: number, end: number, left: number, width: number }[]} `left` and `width` are percentages.
 */
export function buildClipBlocks(clips, span) {
  return clips.map((clip) => {
    const start = timeToSeconds(clip.inicio);
    const end = timeToSeconds(clip.fin);
    return {
      name: clip.name,
      start,
      end,
      left: (start / span) * 100,
      width: ((end - start) / span) * 100,
    };
  });
}

/** First clip boundary within `threshold` seconds of `time`, or null. */
export function findSnapTime(time, blocks, threshold) {
  for (const { start, end } of blocks) {
    if (Math.abs(time - start) < threshold) return start;
    if (Math.abs(time - end) < threshold) return end;
  }
  return null;
}
