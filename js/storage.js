import {
  transcriptions,
  clips,
  selectedTranscriptions,
  setTranscriptions,
  setClips,
  setSelectedTranscriptions,
  setJsonClips,
} from "./state.js";
import { renderTable, updateStatus } from "./editorTab.js";
import { renderJsonClips, toggleJsonImportButton } from "./viewerTab.js";

export function initStorage() {
  loadFromLocalStorage();
}

export function saveToLocalStorage() {
  try {
    localStorage.setItem("clipperino_transcriptions", JSON.stringify(transcriptions));
    localStorage.setItem("clipperino_clips", JSON.stringify(clips));
    localStorage.setItem("clipperino_selected", JSON.stringify(selectedTranscriptions));
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

    if (savedTranscriptions) {
      setTranscriptions(JSON.parse(savedTranscriptions));
      renderTable();
      updateStatus();
    }

    if (savedClips) {
      setClips(JSON.parse(savedClips));
      if (window.renderClips) {
        window.renderClips();
      }
    }

    if (savedSelected) {
      setSelectedTranscriptions(JSON.parse(savedSelected));
      renderTable();
    }

    if (savedJsonClips) {
      const parsedJsonClips = JSON.parse(savedJsonClips);
      setJsonClips(parsedJsonClips);
      renderJsonClips(parsedJsonClips, false);
      toggleJsonImportButton();
    }
  } catch (e) {
    console.error("Error loading from localStorage:", e);
  }
}
