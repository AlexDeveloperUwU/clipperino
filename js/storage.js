import {
  transcriptions,
  clips,
  selectedTranscriptions,
  setTranscriptions,
  setClips,
  setSelectedTranscriptions,
  setJsonClips,
  setVideoMetadata,
  videoMetadata,
} from "./state.js";
import { renderTable, updateStatus, navigateToLine } from "./editorTab.js";
import { renderViewer } from "./viewerTab.js";
import { checkVideoMetadata } from "./previewTab.js";
import { showNotification } from "./ui.js";

const STORAGE_KEYS = [
  "clipperino_transcriptions",
  "clipperino_clips",
  "clipperino_selected",
  "clipperino_json_clips",
  "clipperino_video_meta",
  "clipperino_last_viewed_line",
];

export function hasSavedData() {
  return !!(
    localStorage.getItem("clipperino_transcriptions") ||
    localStorage.getItem("clipperino_clips") ||
    localStorage.getItem("clipperino_json_clips") ||
    localStorage.getItem("clipperino_video_meta")
  );
}

export function clearSavedData() {
  STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

// Selecting a single line triggers a save; serialising the whole transcript
// per click is wasteful for large CSVs, so saves are coalesced and flushed
// before the page goes away.
const SAVE_DEBOUNCE_MS = 300;
let saveTimeout = null;

export function saveToLocalStorage() {
  if (saveTimeout !== null) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(flushSaveToLocalStorage, SAVE_DEBOUNCE_MS);
}

export function flushSaveToLocalStorage() {
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  try {
    localStorage.setItem(
      "clipperino_transcriptions",
      JSON.stringify(transcriptions),
    );
    localStorage.setItem("clipperino_clips", JSON.stringify(clips));
    localStorage.setItem(
      "clipperino_selected",
      JSON.stringify(selectedTranscriptions),
    );
    if (videoMetadata.name) {
      localStorage.setItem(
        "clipperino_video_meta",
        JSON.stringify(videoMetadata),
      );
    }
  } catch (e) {
    if (e && e.name === "QuotaExceededError") {
      showNotification(
        "Storage limit reached — recent changes are not being saved. Export your clips or remove data.",
      );
    }
    console.error("Error saving to localStorage:", e);
  }
}

window.addEventListener("beforeunload", flushSaveToLocalStorage);
window.addEventListener("pagehide", flushSaveToLocalStorage);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushSaveToLocalStorage();
});

export function loadFromLocalStorage() {
  // Each key is parsed independently so one corrupted key doesn't prevent
  // the rest of the session from being restored.
  const savedTranscriptions = localStorage.getItem(
    "clipperino_transcriptions",
  );
  const savedClips = localStorage.getItem("clipperino_clips");
  const savedSelected = localStorage.getItem("clipperino_selected");
  const savedJsonClips = localStorage.getItem("clipperino_json_clips");
  const savedVideoMeta = localStorage.getItem("clipperino_video_meta");

  if (savedTranscriptions) {
    try {
      setTranscriptions(JSON.parse(savedTranscriptions));
      updateStatus();

      const lastViewedLine = parseInt(
        localStorage.getItem("clipperino_last_viewed_line"),
      );

      if (!isNaN(lastViewedLine) && lastViewedLine >= 0) {
        setTimeout(() => {
          if (typeof navigateToLine === "function") {
            navigateToLine(lastViewedLine);
          } else {
            console.error("Error: navigateToLine is not a function");
            renderTable();
          }
        }, 200);
      } else {
        renderTable();
      }
    } catch (e) {
      console.error("Error restoring transcriptions:", e);
    }
  }

  if (savedClips) {
    try {
      setClips(JSON.parse(savedClips));
      if (window.renderClips) {
        window.renderClips();
      }
    } catch (e) {
      console.error("Error restoring clips:", e);
    }
  }

  if (savedSelected) {
    try {
      setSelectedTranscriptions(JSON.parse(savedSelected));
    } catch (e) {
      console.error("Error restoring selection:", e);
    }
  }

  if (savedVideoMeta) {
    try {
      setVideoMetadata(JSON.parse(savedVideoMeta));
      checkVideoMetadata();
    } catch (e) {
      console.error("Error restoring video metadata:", e);
    }
  }

  if (transcriptions.length > 0) {
    setTimeout(() => {
      renderTable();
    }, 0);
  }

  if (savedJsonClips) {
    try {
      const parsedJsonClips = JSON.parse(savedJsonClips);
      setJsonClips(parsedJsonClips);
      renderViewer(parsedJsonClips, false);
    } catch (e) {
      console.error("Error restoring JSON clips:", e);
      setTimeout(() => renderViewer(), 0);
    }
  } else {
    setTimeout(() => renderViewer(), 0);
  }
}
