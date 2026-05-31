import {
  saveProjectBtn,
  projectFileInput,
  saveProjectModal,
  saveProjectNameInput,
  cancelSaveProjectBtn,
  confirmSaveProjectBtn,
} from "./elements.js";
import {
  transcriptions,
  clips,
  selectedTranscriptions,
  videoMetadata,
  lastViewedLineIndex,
  setTranscriptions,
  setClips,
  setSelectedTranscriptions,
  setVideoMetadata,
  setLastViewedLineIndex,
  isProjectActive,
  APP_VERSION,
} from "./state.js";
import { showNotification, switchTab } from "./ui.js";
import { saveToLocalStorage } from "./storage.js";
import {
  renderTable,
  updateStatus,
  toggleImportButton,
} from "./editorTab.js";
import { renderViewer } from "./viewerTab.js";
import { checkVideoMetadata, renderTimeline } from "./previewTab.js";

const PROJECT_FORMAT = "clipperino-project";
const PROJECT_EXTENSION = ".clpproj";

export function initProjectFile() {
  if (saveProjectBtn) {
    saveProjectBtn.addEventListener("click", saveProject);
  }
  if (projectFileInput) {
    projectFileInput.addEventListener("change", handleProjectFileInput);
  }
  if (cancelSaveProjectBtn) {
    cancelSaveProjectBtn.addEventListener("click", closeSaveProjectModal);
  }
  if (confirmSaveProjectBtn) {
    confirmSaveProjectBtn.addEventListener("click", confirmSaveProject);
  }
  if (saveProjectNameInput) {
    saveProjectNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmSaveProject();
      }
    });
  }
  if (saveProjectModal) {
    saveProjectModal.addEventListener("click", (e) => {
      if (e.target === saveProjectModal) closeSaveProjectModal();
    });
  }
}

async function gzip(str) {
  const stream = new Blob([str])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(buf) {
  const stream = new Blob([buf])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

const hasCompression =
  typeof CompressionStream !== "undefined" &&
  typeof DecompressionStream !== "undefined";

function saveProject() {
  if (!isProjectActive()) {
    showNotification("Nothing to save yet — load a transcript or create clips");
    return;
  }

  if (saveProjectNameInput) {
    saveProjectNameInput.value = buildSuggestedName(new Date().toISOString());
  }
  openSaveProjectModal();
}

function openSaveProjectModal() {
  if (!saveProjectModal) return;
  saveProjectModal.classList.add("opacity-100", "pointer-events-auto");
  const inner = saveProjectModal.querySelector("div");
  if (inner) {
    inner.classList.remove("scale-95");
    inner.classList.add("scale-100");
  }
  setTimeout(() => {
    if (saveProjectNameInput) {
      saveProjectNameInput.focus();
      saveProjectNameInput.select();
    }
  }, 100);
}

function closeSaveProjectModal() {
  if (!saveProjectModal) return;
  saveProjectModal.classList.remove("opacity-100", "pointer-events-auto");
  const inner = saveProjectModal.querySelector("div");
  if (inner) {
    inner.classList.add("scale-95");
    inner.classList.remove("scale-100");
  }
}

async function confirmSaveProject() {
  const fileName = sanitizeFileName(
    saveProjectNameInput ? saveProjectNameInput.value : "",
  );

  const savedAt = new Date().toISOString();
  const envelope = {
    format: PROJECT_FORMAT,
    schemaVersion: 1,
    appVersion: APP_VERSION,
    savedAt,
    data: {
      transcriptions,
      clips,
      selectedTranscriptions,
      videoMetadata,
      lastViewedLineIndex,
    },
  };

  try {
    const json = JSON.stringify(envelope);

    let blob;
    if (hasCompression) {
      const compressed = await gzip(json);
      blob = new Blob([compressed], { type: "application/gzip" });
    } else {
      blob = new Blob([json], { type: "application/json" });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}${PROJECT_EXTENSION}`;
    a.click();
    URL.revokeObjectURL(url);

    closeSaveProjectModal();
    showNotification("Project saved");
  } catch (e) {
    console.error("Error saving project:", e);
    showNotification("Error saving project");
  }
}

function buildSuggestedName(savedAt) {
  const base = (videoMetadata && videoMetadata.name) || "project";
  const safeBase = base
    .replace(/\.[^/.]+$/, "") 
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .slice(0, 60)
    .replace(/^_+|_+$/g, "");
  const date = savedAt.slice(0, 10);
  return `clipperino-${safeBase || "project"}-${date}`;
}

function sanitizeFileName(input) {
  let name = input.trim();
  name = name.replace(/\.clpproj$/i, "").trim();
  name = name.replace(/[<>:"/\\|?*\x00-\x1f]+/g, "_").slice(0, 100);
  return name || "project";
}

function handleProjectFileInput(event) {
  const file = event.target.files[0];
  if (file) {
    openProjectFromFile(file);
  }
  event.target.value = "";
}

export async function openProjectFromFile(file) {
  try {
    const buffer = await file.arrayBuffer();

    let json;
    if (hasCompression) {
      try {
        json = await gunzip(buffer);
      } catch {
        json = new TextDecoder().decode(buffer);
      }
    } else {
      json = new TextDecoder().decode(buffer);
    }

    const envelope = JSON.parse(json);

    if (!envelope || envelope.format !== PROJECT_FORMAT || !envelope.data) {
      showNotification("Invalid or unrecognized project file");
      return;
    }

    if (isProjectActive()) {
      const ok = window.confirm(
        "Opening this project will replace your current session (transcript, clips and selection). Continue?",
      );
      if (!ok) return;
    }

    restoreProject(envelope.data);
    showNotification("Project loaded");
  } catch (e) {
    console.error("Error opening project:", e);
    showNotification("Error opening project file");
  }
}

function restoreProject(data) {
  setTranscriptions(Array.isArray(data.transcriptions) ? data.transcriptions : []);
  setClips(Array.isArray(data.clips) ? data.clips : []);
  setSelectedTranscriptions(
    Array.isArray(data.selectedTranscriptions) ? data.selectedTranscriptions : [],
  );
  setVideoMetadata(
    data.videoMetadata && typeof data.videoMetadata === "object"
      ? data.videoMetadata
      : { name: null, duration: 0 },
  );

  if (typeof data.lastViewedLineIndex === "number" && data.lastViewedLineIndex >= 0) {
    setLastViewedLineIndex(data.lastViewedLineIndex);
  }

  saveToLocalStorage();

  renderTable();
  if (window.renderClips) window.renderClips();
  updateStatus();
  toggleImportButton();
  renderViewer();
  checkVideoMetadata();
  renderTimeline();

  switchTab("editor");
}
