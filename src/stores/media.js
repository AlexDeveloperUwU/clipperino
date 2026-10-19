import { computed, ref, shallowRef, watch } from "vue";
import { defineStore } from "pinia";
import { useUiStore } from "./ui.js";
import { useProjectStore } from "./project.js";
import { formatTime, timeToSeconds } from "../lib/timecode.js";

const CLIP_SKIP_TOLERANCE = 0.5;
const VIDEO_LENGTH_SLACK = 3;
const VOLUME_KEY = "clipperino_volume";

/** Last volume and mute state, or full volume when nothing valid is stored. */
function readVolume() {
  try {
    const saved = JSON.parse(localStorage.getItem(VOLUME_KEY));
    const volume = Number(saved?.volume);
    return { volume: volume >= 0 && volume <= 1 ? volume : 1, muted: saved?.muted === true };
  } catch {
    return { volume: 1, muted: false };
  }
}

/** The loaded video, its playback state, and the subtitle overlay setting. */
export const useMediaStore = defineStore("media", () => {
  const ui = useUiStore();
  const project = useProjectStore();

  /** Name and duration survive reloads; the file itself must be loaded again. */
  const meta = ref({ name: null, duration: 0 });
  const mediaUrl = ref(null);
  const element = shallowRef(null);
  const currentTime = ref(0);
  const elementDuration = ref(0);
  const paused = ref(true);
  const showSubtitles = ref(false);
  const initialVolume = readVolume();
  const volume = ref(initialVolume.volume);
  const muted = ref(initialVolume.muted);
  let previousMeta = { name: null, duration: 0 };
  let pendingLoad = null;

  const hasMedia = computed(() => mediaUrl.value !== null);
  const needsReload = computed(() => !hasMedia.value && !!meta.value.name);
  const duration = computed(() => {
    const known = Number.isFinite(elementDuration.value) && elementDuration.value > 0;
    return known ? elementDuration.value : meta.value.duration;
  });

  /** Seconds the timeline covers: the video, or the transcript and clips when they run longer. */
  const timelineSpan = computed(() => Math.max(duration.value, project.endSeconds));

  const subtitleEntries = computed(() =>
    project.transcriptions
      .map((t) => ({
        start: timeToSeconds(t.inicio),
        end: timeToSeconds(t.fin),
        text: t.transcripcion,
      }))
      .sort((a, b) => a.start - b.start),
  );
  const currentSubtitle = computed(() => {
    const t = currentTime.value;
    return subtitleEntries.value.find((e) => t >= e.start && t <= e.end)?.text ?? null;
  });

  const clipsByStart = computed(() =>
    project.clips
      .map((clip) => ({ clip, start: timeToSeconds(clip.inicio) }))
      .sort((a, b) => a.start - b.start),
  );

  /** Whether a video of this length can hold the whole transcript; if not, it is probably the wrong one. */
  function coversTranscript(seconds) {
    return seconds + VIDEO_LENGTH_SLACK >= project.endSeconds;
  }

  /**
   * Loads a video file, releasing the previous one. The outcome is announced once its length is
   * known, so a rejected video never shows a "loaded" message first.
   */
  function load(file) {
    pendingLoad = { name: file.name, savedName: meta.value.name };
    previousMeta = meta.value;
    releaseUrl();
    mediaUrl.value = URL.createObjectURL(file);
    meta.value = { name: file.name, duration: 0 };
    currentTime.value = 0;
    elementDuration.value = 0;
  }

  /** Drops a video that cannot belong to the transcript, restores the metadata it replaced, and says why. */
  function rejectVideo(message, restoredMeta) {
    element.value?.pause();
    releaseUrl();
    elementDuration.value = 0;
    currentTime.value = 0;
    paused.value = true;
    meta.value = restoredMeta;
    ui.notify(message);
  }

  /** Unloads the video and forgets its metadata. */
  function clear({ silent = false } = {}) {
    element.value?.pause();
    releaseUrl();
    meta.value = { name: null, duration: 0 };
    currentTime.value = 0;
    elementDuration.value = 0;
    paused.value = true;
    if (!silent) ui.notify("Video cleared");
  }

  /** Revokes the current object URL so the file can be garbage collected. */
  function releaseUrl() {
    if (mediaUrl.value) URL.revokeObjectURL(mediaUrl.value);
    mediaUrl.value = null;
  }

  /** Records the real duration once the element has read the file, rejecting a video shorter than the transcript. */
  function onMetadata() {
    const reported = element.value.duration;
    const finite = Number.isFinite(reported) ? reported : 0;
    const load = pendingLoad ?? { name: meta.value.name, savedName: null };
    pendingLoad = null;

    if (finite > 0 && !coversTranscript(finite)) {
      const expected = load.savedName ? ` Expected ${load.savedName}.` : "";
      rejectVideo(
        `Wrong video: ${load.name} is ${formatTime(finite)} long, but the transcript runs ${formatTime(project.endSeconds)}.${expected}`,
        previousMeta,
      );
      return;
    }

    elementDuration.value = finite;
    meta.value = { name: meta.value.name || "Unknown Video", duration: finite };
    const differs = load.savedName && load.savedName !== load.name;
    ui.notify(
      `Video loaded: ${load.name} (${formatTime(finite)})${differs ? `. The saved video was ${load.savedName}.` : ""}`,
    );
  }

  watch(
    () => project.endSeconds,
    () => {
      if (elementDuration.value > 0 && !coversTranscript(elementDuration.value)) {
        rejectVideo(
          `${meta.value.name} (${formatTime(elementDuration.value)}) is shorter than the new transcript (${formatTime(project.endSeconds)}) and was unloaded.`,
          { name: null, duration: 0 },
        );
      }
    },
  );

  watch(
    [volume, muted, element],
    () => {
      if (element.value) {
        element.value.volume = volume.value;
        element.value.muted = muted.value;
      }
      try {
        localStorage.setItem(
          VOLUME_KEY,
          JSON.stringify({ volume: volume.value, muted: muted.value }),
        );
      } catch (e) {
        console.warn("Could not save the volume:", e);
      }
    },
    { immediate: true },
  );

  /** Sets the volume (0–1); raising it from zero or while muted unmutes. */
  function setVolume(value) {
    volume.value = Math.min(1, Math.max(0, value));
    muted.value = volume.value === 0;
  }

  /** Mutes or unmutes without losing the chosen volume. */
  function toggleMute() {
    muted.value = !muted.value;
  }

  /** Restores saved metadata, ignoring malformed values. */
  function restoreMeta(value) {
    meta.value =
      value && typeof value === "object"
        ? { name: value.name ?? null, duration: Number(value.duration) || 0 }
        : { name: null, duration: 0 };
  }

  /**
   * Moves playback to `seconds` when the loaded video reaches that far.
   * @returns {boolean} False when no video is loaded or the position is past its end.
   */
  function seek(seconds) {
    if (!element.value || !(elementDuration.value > 0) || seconds > elementDuration.value) {
      return false;
    }
    element.value.currentTime = seconds;
    return true;
  }

  /** Seeks to `seconds` and announces `message`, or explains why the position can't be reached. */
  function jumpTo(seconds, message) {
    if (seek(seconds)) {
      ui.notify(message);
    } else {
      ui.notify(
        hasMedia.value
          ? `${formatTime(seconds)} is past the end of the video`
          : "Load the video to jump to a clip",
      );
    }
  }

  /** Plays or pauses; ignored when no video is loaded. */
  function togglePlay() {
    const el = element.value;
    if (!el || !hasMedia.value) return;
    if (el.paused) el.play();
    else el.pause();
  }

  /** Jumps to the first clip that starts after the playhead. */
  function skipToNextClip() {
    const next = clipsByStart.value.find((c) => c.start > currentTime.value + CLIP_SKIP_TOLERANCE);
    if (next) {
      jumpTo(next.start, `Skipped to: ${next.clip.name}`);
    } else {
      ui.notify("No more clips ahead");
    }
  }

  /** Jumps to the closest clip start before the playhead, or to 0. */
  function skipToPrevClip() {
    const prev = [...clipsByStart.value]
      .reverse()
      .find((c) => c.start < currentTime.value - CLIP_SKIP_TOLERANCE);
    if (prev) {
      jumpTo(prev.start, `Skipped back to: ${prev.clip.name}`);
    } else {
      seek(0);
    }
  }

  return {
    meta,
    mediaUrl,
    element,
    currentTime,
    elementDuration,
    paused,
    showSubtitles,
    volume,
    muted,
    setVolume,
    toggleMute,
    hasMedia,
    needsReload,
    duration,
    timelineSpan,
    currentSubtitle,
    load,
    clear,
    onMetadata,
    restoreMeta,
    seek,
    jumpTo,
    togglePlay,
    skipToNextClip,
    skipToPrevClip,
  };
});
