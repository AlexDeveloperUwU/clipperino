import { watch } from "vue";
import { useProjectStore } from "../stores/project.js";
import { useMediaStore } from "../stores/media.js";
import { useUiStore } from "../stores/ui.js";

const KEYS = {
  transcriptions: "clipperino_transcriptions",
  clips: "clipperino_clips",
  selected: "clipperino_selected",
  video: "clipperino_video_meta",
  lastLine: "clipperino_last_viewed_line",
};
const LEGACY_KEYS = ["clipperino_json_clips"];
const SAVE_DEBOUNCE_MS = 300;

let started = false;

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`Error restoring ${key}:`, e);
    return null;
  }
}

/** True when a previous session holds anything worth restoring (empty arrays don't count). */
export function hasSavedData() {
  const filled = (key) => {
    const value = readJson(key);
    return Array.isArray(value) ? value.length > 0 : !!value;
  };
  return [KEYS.transcriptions, KEYS.clips, KEYS.video].some(filled);
}

/** Removes every saved session key, including ones from older versions. */
export function clearSavedData() {
  [...Object.values(KEYS), ...LEGACY_KEYS].forEach((key) => localStorage.removeItem(key));
}

/** Restores the last session; each key parses on its own so one bad key can't block the rest. */
export function loadSession() {
  const project = useProjectStore();
  const media = useMediaStore();
  const ui = useUiStore();

  const lastLine = parseInt(localStorage.getItem(KEYS.lastLine), 10);
  project.restore({
    transcriptions: readJson(KEYS.transcriptions),
    clips: readJson(KEYS.clips),
    selected: readJson(KEYS.selected),
    lastViewedLine: isNaN(lastLine) ? -1 : lastLine,
  });
  media.restoreMeta(readJson(KEYS.video));

  if (project.lastViewedLine >= 0) ui.navigateToLine(project.lastViewedLine);
}

function writeSession(project, media, ui) {
  if (!project.isActive && !media.meta.name) {
    clearSavedData();
    return;
  }
  try {
    localStorage.setItem(KEYS.transcriptions, JSON.stringify(project.transcriptions));
    localStorage.setItem(KEYS.clips, JSON.stringify(project.clips));
    localStorage.setItem(KEYS.selected, JSON.stringify(project.selected));
    setOrRemove(KEYS.video, media.meta.name ? JSON.stringify(media.meta) : null);
    setOrRemove(KEYS.lastLine, project.lastViewedLine >= 0 ? String(project.lastViewedLine) : null);
  } catch (e) {
    if (e?.name === "QuotaExceededError") {
      ui.notify(
        "Storage limit reached — recent changes are not being saved. Export your clips or remove data.",
      );
    }
    console.error("Error saving to localStorage:", e);
  }
}

function setOrRemove(key, value) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

/**
 * Auto-saves the session (debounced) and flushes when the page goes away.
 * Start it only after the startup prompt is resolved, or an early flush
 * would overwrite the saved session with an empty one.
 */
export function startPersistence() {
  if (started) return;
  started = true;

  const project = useProjectStore();
  const media = useMediaStore();
  const ui = useUiStore();
  let timer = null;

  const flush = () => {
    clearTimeout(timer);
    writeSession(project, media, ui);
  };

  watch(
    [
      () => project.transcriptions,
      () => project.clips,
      () => project.selected,
      () => project.lastViewedLine,
      () => media.meta,
    ],
    () => {
      clearTimeout(timer);
      timer = setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
  );

  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
