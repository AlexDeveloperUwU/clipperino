import { onBeforeUnmount, onMounted, ref } from "vue";
import { useMediaStore } from "../stores/media.js";
import { findSnapTime } from "../lib/timeline.js";

const SNAP_PX = 15;

/**
 * Drag-to-seek on a timeline element, with magnetic snapping to clip boundaries.
 * @param {import("vue").Ref<HTMLElement | null>} track Element spanning the whole timeline.
 * @param {() => { start: number, end: number }[]} getBlocks Clip boundaries in seconds.
 */
export function useTimelineScrub(track, getBlocks) {
  const media = useMediaStore();

  const scrubbing = ref(false);
  const scrubTime = ref(0);
  const snapTime = ref(null);
  let pendingSeek = null;
  let seekFrame = null;

  /**
   * Moves the playhead to the pointer, snapping when close to a clip edge.
   * Seeks at most once per frame: a seek on every mousemove storms the decoder on long videos.
   * Positions past the end of the video leave the video at its last frame.
   */
  function scrubTo(event) {
    const total = media.timelineSpan;
    const rect = track.value.getBoundingClientRect();
    const rawTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * total;

    snapTime.value = findSnapTime(rawTime, getBlocks(), (SNAP_PX / rect.width) * total);
    scrubTime.value = snapTime.value ?? rawTime;

    pendingSeek = scrubTime.value;
    seekFrame ??= requestAnimationFrame(() => {
      seekFrame = null;
      media.seek(pendingSeek);
    });
  }

  function start(event) {
    if (!(media.elementDuration > 0)) return;
    scrubbing.value = true;
    scrubTo(event);
  }

  function move(event) {
    if (scrubbing.value) scrubTo(event);
  }

  function end() {
    scrubbing.value = false;
    snapTime.value = null;
  }

  onMounted(() => {
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", end);
  });

  return { scrubbing, scrubTime, snapTime, start };
}
