import {
  videoFileInput,
  previewVideoPlayer,
  videoPlaceholder,
  placeholderTitle,
  placeholderText,
  timelineTrack,
  timelineContentWrapper,
  timelineRuler,
  playhead,
  snapLine,
  snapIndicator,
  timelineDuration,
  videoNameDisplay,
  previewTabBtn,
  zoomInBtn,
  zoomOutBtn,
  zoomInput
} from "./elements.js";
import { clips, videoMetadata, setVideoMetadata } from "./state.js";
import { showNotification } from "./ui.js";
import { saveToLocalStorage } from "./storage.js";

let zoomLevel = 1;
let currentSnapTime = null;
let isScrubbing = false;

export function initPreviewTab() {
  videoFileInput.addEventListener("change", handleVideoUpload);
  previewTabBtn.addEventListener("click", () => renderTimeline());

  previewVideoPlayer.addEventListener("timeupdate", updatePlayhead);
  previewVideoPlayer.addEventListener("loadedmetadata", () => {
    updateDurationDisplay();
    renderTimeline();

    setVideoMetadata({
      name: videoMetadata.name || "Unknown Video",
      duration: previewVideoPlayer.duration
    });
    saveToLocalStorage();
  });

  timelineContentWrapper.addEventListener("mousedown", handleScrubStart);
  window.addEventListener("mousemove", handleScrubMove);
  window.addEventListener("mouseup", handleScrubEnd);

  zoomInBtn.addEventListener("click", handleZoomIn);
  zoomOutBtn.addEventListener("click", handleZoomOut);
  zoomInput.addEventListener("change", handleZoomInput);
}

export function checkVideoMetadata() {
  if (videoMetadata && videoMetadata.name) {
    placeholderTitle.textContent = "Video Reload Required";
    placeholderText.innerHTML = `Please re-load <strong class="text-white">${videoMetadata.name}</strong> to continue previewing.`;
    videoNameDisplay.textContent = videoMetadata.name;
    videoNameDisplay.classList.remove("hidden");
  }
}

function handleVideoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const fileURL = URL.createObjectURL(file);
    previewVideoPlayer.src = fileURL;
    videoPlaceholder.classList.add("hidden");

    videoNameDisplay.textContent = file.name;
    videoNameDisplay.classList.remove("hidden");

    setVideoMetadata({
      name: file.name,
      duration: 0
    });
    saveToLocalStorage();

    showNotification(`Video loaded: ${file.name}`);
  }
}

function updateDurationDisplay() {
  const duration = previewVideoPlayer.duration;
  if (!isNaN(duration)) {
    timelineDuration.textContent = formatTime(duration);
  }
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function timeStringToSeconds(timeString) {
  const parts = timeString.split(":").map(Number);
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  }
  return seconds;
}

function handleZoomIn() {
  zoomLevel = Math.min(50, zoomLevel + 0.5);
  updateZoomUI();
  renderTimeline();
}

function handleZoomOut() {
  zoomLevel = Math.max(1, zoomLevel - 0.5);
  updateZoomUI();
  renderTimeline();
}

function handleZoomInput() {
  let val = parseInt(zoomInput.value);
  if (isNaN(val)) val = 100;

  val = Math.max(10, Math.min(5000, val));

  zoomLevel = val / 100;
  updateZoomUI();
  renderTimeline();
}

function updateZoomUI() {
  zoomInput.value = Math.round(zoomLevel * 100);
}

export function renderTimeline() {
  timelineTrack.innerHTML = "";
  timelineRuler.innerHTML = "";

  const duration = previewVideoPlayer.duration || videoMetadata.duration || 10;
  timelineContentWrapper.style.width = `${zoomLevel * 100}%`;

  drawRuler(duration);
  drawClips(duration);

  if (window.lucide) window.lucide.createIcons();
}

function drawClips(duration) {
  clips.forEach((clip) => {
    const startSeconds = timeStringToSeconds(clip.inicio);
    const endSeconds = timeStringToSeconds(clip.fin);

    const startPercent = (startSeconds / duration) * 100;
    const durationPercent = ((endSeconds - startSeconds) / duration) * 100;

    const clipEl = document.createElement("div");
    clipEl.className = "absolute top-2 bottom-2 bg-accent-100/20 border border-accent-100/50 hover:bg-accent-100/40 hover:border-accent-100 cursor-pointer transition-colors rounded-sm group overflow-hidden shadow-sm";
    clipEl.style.left = `${startPercent}%`;
    clipEl.style.width = `${durationPercent}%`;

    clipEl.dataset.start = startSeconds;
    clipEl.dataset.end = endSeconds;

    const stripe = document.createElement("div");
    stripe.className = "absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)] pointer-events-none";
    clipEl.appendChild(stripe);

    const label = document.createElement("div");
    label.className = "absolute top-1 left-1 text-[10px] text-gray-200 font-bold truncate max-w-full px-1 drop-shadow-md pointer-events-none select-none";
    label.textContent = clip.name;
    clipEl.appendChild(label);

    clipEl.addEventListener("mousedown", (e) => {
      e.stopPropagation(); 
      previewVideoPlayer.currentTime = startSeconds;
      showNotification(`Jumped to clip: ${clip.name}`);
    });

    timelineTrack.appendChild(clipEl);
  });
}

function drawRuler(duration) {
  const widthPx = timelineContentWrapper.getBoundingClientRect().width;
  if (!widthPx) return;

  const secondsPerPixel = duration / widthPx;
  let intervalStep = 1;

  const targetPixelsPerStep = 100;
  const rawStep = targetPixelsPerStep * secondsPerPixel;

  if (rawStep < 1) intervalStep = 1;
  else if (rawStep < 5) intervalStep = 5;
  else if (rawStep < 10) intervalStep = 10;
  else if (rawStep < 30) intervalStep = 30;
  else if (rawStep < 60) intervalStep = 60;
  else if (rawStep < 300) intervalStep = 300;
  else intervalStep = 600;

  const steps = Math.floor(duration / intervalStep);

  for (let i = 0; i <= steps; i++) {
    const seconds = i * intervalStep;
    const percent = (seconds / duration) * 100;

    const mark = document.createElement("div");
    mark.className = "absolute top-0 bottom-0 border-l border-gray-600/50 pl-1 pt-1";
    mark.style.left = `${percent}%`;

    const label = document.createElement("span");
    label.textContent = formatTimeShort(seconds);
    mark.appendChild(label);

    timelineRuler.appendChild(mark);
  }
}

function formatTimeShort(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updatePlayhead() {
  if (isScrubbing) return;

  const duration = previewVideoPlayer.duration;
  const currentTime = previewVideoPlayer.currentTime;

  if (!isNaN(duration) && duration > 0) {
    const percent = (currentTime / duration) * 100;
    playhead.style.left = `${percent}%`;
  }
}

function handleScrubStart(e) {
  const duration = previewVideoPlayer.duration;
  if (isNaN(duration) || duration === 0) return;

  isScrubbing = true;
  handleScrubMove(e); 
}

function handleScrubMove(e) {
  if (!isScrubbing) return;

  const duration = previewVideoPlayer.duration;
  if (isNaN(duration) || duration === 0) return;

  const rect = timelineContentWrapper.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const width = rect.width;

  let rawPercent = Math.max(0, Math.min(1, mouseX / width));
  let targetTime = rawPercent * duration;

  let snapTime = null;
  const snapThresholdPx = 15;
  const snapThresholdTime = (snapThresholdPx / width) * duration;

  for (const clip of clips) {
    const start = timeStringToSeconds(clip.inicio);
    const end = timeStringToSeconds(clip.fin);

    if (Math.abs(targetTime - start) < snapThresholdTime) {
      snapTime = start;
      break;
    }
    if (Math.abs(targetTime - end) < snapThresholdTime) {
      snapTime = end;
      break;
    }
  }

  if (snapTime !== null) {
    currentSnapTime = snapTime;
    targetTime = snapTime;

    const snapPercent = (snapTime / duration) * 100;
    snapLine.style.left = `${snapPercent}%`;
    snapLine.classList.remove("hidden");
    snapIndicator.classList.add("opacity-100");
  } else {
    currentSnapTime = null;
    snapLine.classList.add("hidden");
    snapIndicator.classList.remove("opacity-100");
  }

  const finalPercent = (targetTime / duration) * 100;
  playhead.style.left = `${finalPercent}%`;

  previewVideoPlayer.currentTime = targetTime;
}

function handleScrubEnd(e) {
  if (isScrubbing) {
    isScrubbing = false;
    snapLine.classList.add("hidden");
    snapIndicator.classList.remove("opacity-100");
  }
}