import { computed, ref, watch } from "vue";
import { useMediaStore } from "../stores/media.js";
import { useUiStore } from "../stores/ui.js";

const MIN_ZOOM = 0.1;
const MIN_MAX_ZOOM = 50;
const MIN_VISIBLE_SECONDS = 5;
const ZOOM_FACTOR = 1.5;

/**
 * Timeline zoom state (1 = whole timeline in view) with fit-to-video on load.
 * @param {import("vue").Ref<HTMLElement | null>} scroller Horizontally scrolling timeline viewport.
 */
export function useTimelineZoom(scroller) {
  const media = useMediaStore();
  const ui = useUiStore();
  const zoom = ref(1);

  /** Highest zoom: at least 5000%, and enough to fit a few seconds of a very long timeline on screen. */
  const maxZoom = computed(() => Math.max(MIN_MAX_ZOOM, media.timelineSpan / MIN_VISIBLE_SECONDS));

  function setZoom(value) {
    zoom.value = Math.round(Math.min(maxZoom.value, Math.max(MIN_ZOOM, value)) * 100) / 100;
  }

  /** Zooms in (+1) or out (-1) by a constant factor, so long timelines stay reachable. */
  function zoomBy(direction) {
    ui.signal("zoom");
    setZoom(direction > 0 ? zoom.value * ZOOM_FACTOR : zoom.value / ZOOM_FACTOR);
  }

  function fitToVideo() {
    if (!(media.elementDuration > 0)) return;
    setZoom(Math.max(1, media.timelineSpan / media.elementDuration));
    if (scroller.value) scroller.value.scrollLeft = 0;
  }

  watch(() => media.elementDuration, fitToVideo, { immediate: true });

  /** Applies a typed percentage and writes the clamped value back to the input. */
  function onZoomInput(event) {
    ui.signal("zoom");
    const value = parseInt(event.target.value, 10);
    setZoom((isNaN(value) ? 100 : value) / 100);
    event.target.value = Math.round(zoom.value * 100);
  }

  return { zoom, maxZoom, zoomBy, onZoomInput };
}
