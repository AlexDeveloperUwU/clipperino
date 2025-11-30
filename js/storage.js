import {
  transcriptions,
  clips,
  selectedTranscriptions,
  setTranscriptions,
  setClips,
  setSelectedTranscriptions,
  setJsonClips,
  setVideoMetadata,
  videoMetadata
} from "./state.js";
import { renderTable, updateStatus, navigateToLine } from "./editorTab.js";
import { renderViewer } from "./viewerTab.js";
import { checkVideoMetadata } from "./previewTab.js";

export function initStorage() {
  loadFromLocalStorage();
}

export function saveToLocalStorage() {
  try {
    localStorage.setItem("clipperino_transcriptions", JSON.stringify(transcriptions));
    localStorage.setItem("clipperino_clips", JSON.stringify(clips));
    localStorage.setItem("clipperino_selected", JSON.stringify(selectedTranscriptions));
    if (videoMetadata.name) {
      localStorage.setItem("clipperino_video_meta", JSON.stringify(videoMetadata));
    }
  } catch (e) {
    console.error("Error saving to localStorage:", e);
  }
}

function loadFromLocalStorage() {
  try {
    const savedTranscriptions = localStorage.getItem("clipperino_transcriptions");
    const savedClips = localStorage.getItem("clipperino_clips");
    const savedSelected = localStorage.getItem("clipperino_selected");
    const savedJsonClips = localStorage.getItem("clipperino_json_clips");
    const savedVideoMeta = localStorage.getItem("clipperino_video_meta");

    if (savedTranscriptions) {
      setTranscriptions(JSON.parse(savedTranscriptions));
      updateStatus();

      const lastViewedLine = parseInt(localStorage.getItem("clipperino_last_viewed_line"));

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
    }

    if (savedClips) {
      setClips(JSON.parse(savedClips));
      if (window.renderClips) {
        window.renderClips();
      }
    }

    if (savedSelected) {
      setSelectedTranscriptions(JSON.parse(savedSelected));
    }

    if (savedVideoMeta) {
      setVideoMetadata(JSON.parse(savedVideoMeta));
      checkVideoMetadata();
    }

    if (transcriptions.length > 0) {
      setTimeout(() => {
        renderTable();
      }, 0);
    }

    if (savedJsonClips) {
      const parsedJsonClips = JSON.parse(savedJsonClips);
      setJsonClips(parsedJsonClips);
      renderViewer(parsedJsonClips, false);
    } else {
      setTimeout(() => renderViewer(), 0);
    }
  } catch (e) {
    console.error("Error loading from localStorage:", e);
    if (transcriptions.length > 0) {
      renderTable();
    }
  }
}