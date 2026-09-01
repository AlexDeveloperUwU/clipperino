import {
  videoFileInput,
  videoFileLabel,
  videoFileLabelText,
  clearVideoBtn,
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
  previewTab,
  previewTabBtn,
  zoomInBtn,
  zoomOutBtn,
  zoomInput,
  playPauseBtn,
  prevClipBtn,
  nextClipBtn,
  audioOutputSelect,
  toggleSubtitlesBtn,
  subtitleOverlay,
  subtitleText,
} from "./elements.js";
import {
  clips,
  jsonClips,
  videoMetadata,
  setVideoMetadata,
  showSubtitles,
  setShowSubtitles,
  transcriptions,
} from "./state.js";
import { showNotification } from "./ui.js";
import { saveToLocalStorage } from "./storage.js";

let zoomLevel = 1;
let currentSnapTime = null;
let isScrubbing = false;

export function initPreviewTab() {
  videoFileInput.addEventListener("change", handleVideoUpload);
  clearVideoBtn.addEventListener("click", clearVideo);
  previewTabBtn.addEventListener("click", () => renderTimeline());

  previewVideoPlayer.addEventListener("timeupdate", updatePlayhead);
  previewVideoPlayer.addEventListener("loadedmetadata", () => {
    updateDurationDisplay();
    renderTimeline();

    setVideoMetadata({
      name: videoMetadata.name || "Unknown Video",
      duration: previewVideoPlayer.duration,
    });
    saveToLocalStorage();
    toggleVideoControls(true);
  });

  previewVideoPlayer.addEventListener("play", () => updatePlayPauseIcon(true));
  previewVideoPlayer.addEventListener("pause", () =>
    updatePlayPauseIcon(false),
  );
  previewVideoPlayer.addEventListener("ended", () =>
    updatePlayPauseIcon(false),
  );

  playPauseBtn.addEventListener("click", togglePlay);
  prevClipBtn.addEventListener("click", skipToPrevClip);
  nextClipBtn.addEventListener("click", skipToNextClip);
  audioOutputSelect.addEventListener("change", handleAudioChange);
  toggleSubtitlesBtn.addEventListener("click", toggleSubtitles);

  timelineContentWrapper.addEventListener("mousedown", handleScrubStart);
  window.addEventListener("mousemove", handleScrubMove);
  window.addEventListener("mouseup", handleScrubEnd);

  zoomInBtn.addEventListener("click", handleZoomIn);
  zoomOutBtn.addEventListener("click", handleZoomOut);
  zoomInput.addEventListener("change", handleZoomInput);

  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    if (previewTab.classList.contains("hidden")) return;
    const tag = document.activeElement.tagName.toLowerCase();
    if (["input", "select", "textarea", "button"].includes(tag)) return;
    e.preventDefault();
    togglePlay();
  });

  initAudioDevices();
}

export function checkVideoMetadata() {
  if (videoMetadata && videoMetadata.name) {
    placeholderTitle.textContent = "Video Reload Required";
    placeholderText.textContent = "";
    const intro = document.createTextNode("Please re-load ");
    const strong = document.createElement("strong");
    strong.className = "text-white";
    strong.textContent = videoMetadata.name;
    placeholderText.append(intro, strong, document.createTextNode(" to continue previewing."));

    videoFileLabel.classList.remove("hidden");
    videoFileLabelText.textContent = "Re-import Video";
    clearVideoBtn.classList.remove("hidden");
  } else {
    toggleVideoControls(false);
  }
}

function toggleVideoControls(hasVideo) {
  if (hasVideo) {
    videoFileLabel.classList.add("hidden");
    clearVideoBtn.classList.remove("hidden");
  } else {
    videoFileLabel.classList.remove("hidden");
    videoFileLabelText.textContent = "Load Video";
    clearVideoBtn.classList.add("hidden");
  }
}

function handleVideoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const fileURL = URL.createObjectURL(file);
    previewVideoPlayer.src = fileURL;
    videoPlaceholder.classList.add("hidden");

    setVideoMetadata({
      name: file.name,
      duration: 0,
    });
    saveToLocalStorage();

    showNotification(`Video loaded: ${file.name}`);
    toggleVideoControls(true);
  }
}

function clearVideo() {
  previewVideoPlayer.pause();
  previewVideoPlayer.src = "";
  videoPlaceholder.classList.remove("hidden");

  placeholderTitle.textContent = "No Video Loaded";
  placeholderText.textContent = "Import a video file to preview your clips";

  setVideoMetadata({ name: null, duration: 0 });
  saveToLocalStorage();

  toggleVideoControls(false);
  showNotification("Video cleared");

  timelineDuration.textContent = "00:00:00";
}

function togglePlay() {
  if (previewVideoPlayer.paused) {
    previewVideoPlayer.play();
  } else {
    previewVideoPlayer.pause();
  }
}

function toggleSubtitles() {
  setShowSubtitles(!showSubtitles);

  if (showSubtitles) {
    toggleSubtitlesBtn.classList.remove("text-gray-400");
    toggleSubtitlesBtn.classList.add("text-accent-100", "bg-accent-100/10");
    subtitleOverlay.classList.remove("hidden");
    updateSubtitles();
  } else {
    toggleSubtitlesBtn.classList.add("text-gray-400");
    toggleSubtitlesBtn.classList.remove("text-accent-100", "bg-accent-100/10");
    subtitleOverlay.classList.add("hidden");
  }
}

// Parsed subtitle timeline. Parsing time strings on every timeupdate was the
// hot path, so entries are computed once per transcript/clips change (detected
// by array identity) and kept sorted for playback lookup.
let subtitleCache = { source: null, entries: [] };

function getSubtitleEntries() {
  const source =
    transcriptions.length > 0
      ? transcriptions
      : jsonClips.flatMap((c) => c.transcriptions);
  if (subtitleCache.source !== source) {
    subtitleCache = {
      source,
      entries: source
        .map((t) => ({
          start: timeStringToSeconds(t.inicio),
          end: timeStringToSeconds(t.fin),
          text: t.transcripcion,
        }))
        .sort((a, b) => a.start - b.start),
    };
  }
  return subtitleCache.entries;
}

function updateSubtitles() {
  if (!showSubtitles) return;

  const entries = getSubtitleEntries();
  if (entries.length === 0) return;

  const currentTime = previewVideoPlayer.currentTime;

  const currentEntry = entries.find(
    (entry) => currentTime >= entry.start && currentTime <= entry.end,
  );

  if (currentEntry) {
    subtitleText.textContent = currentEntry.text;
    subtitleOverlay.classList.remove("opacity-0");
  } else {
    subtitleOverlay.classList.add("opacity-0");
  }
}

function updatePlayPauseIcon(isPlaying) {
  // Both icons are pre-rendered and toggled by class; re-running
  // lucide.createIcons() here rescanned the entire document on every
  // play/pause event.
  const playIcon = playPauseBtn.querySelector(".play-icon");
  const pauseIcon = playPauseBtn.querySelector(".pause-icon");
  if (!playIcon || !pauseIcon) return;
  playIcon.classList.toggle("hidden", isPlaying);
  pauseIcon.classList.toggle("hidden", !isPlaying);
}

function skipToNextClip() {
  const currentTime = previewVideoPlayer.currentTime;
  const activeClips = [...clips, ...jsonClips];
  const sortedClips = [...activeClips].sort(
    (a, b) => timeStringToSeconds(a.inicio) - timeStringToSeconds(b.inicio),
  );

  const nextClip = sortedClips.find(
    (clip) => timeStringToSeconds(clip.inicio) > currentTime + 0.5,
  );

  if (nextClip) {
    previewVideoPlayer.currentTime = timeStringToSeconds(nextClip.inicio);
    showNotification(`Skipped to: ${nextClip.name}`);
  } else {
    showNotification("No more clips ahead");
  }
}

function skipToPrevClip() {
  const currentTime = previewVideoPlayer.currentTime;
  const activeClips = [...clips, ...jsonClips];
  const sortedClips = [...activeClips].sort(
    (a, b) => timeStringToSeconds(a.inicio) - timeStringToSeconds(b.inicio),
  );

  let prevClip = null;
  for (let i = sortedClips.length - 1; i >= 0; i--) {
    const start = timeStringToSeconds(sortedClips[i].inicio);
    if (start < currentTime - 0.5) {
      prevClip = sortedClips[i];
      break;
    }
  }

  if (prevClip) {
    previewVideoPlayer.currentTime = timeStringToSeconds(prevClip.inicio);
    showNotification(`Skipped back to: ${prevClip.name}`);
  } else {
    previewVideoPlayer.currentTime = 0;
  }
}

async function initAudioDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    audioOutputSelect.innerHTML = '<option value="">Not Supported</option>';
    audioOutputSelect.disabled = true;
    return;
  }

  try {
    await navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => stream.getTracks().forEach((t) => t.stop()))
      .catch(() => {});

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutputs = devices.filter(
      (device) => device.kind === "audiooutput",
    );

    if (audioOutputs.length === 0) {
      audioOutputSelect.innerHTML = '<option value="">Default Only</option>';
      audioOutputSelect.disabled = true;
      return;
    }

    audioOutputSelect.innerHTML =
      '<option value="default">Default Output</option>';
    audioOutputs.forEach((device) => {
      if (device.deviceId !== "default") {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.textContent =
          device.label || `Speaker ${audioOutputs.indexOf(device) + 1}`;
        audioOutputSelect.appendChild(option);
      }
    });
  } catch (err) {
    console.warn("Could not enumerate audio devices:", err);
  }
}

async function handleAudioChange() {
  const deviceId = audioOutputSelect.value;
  if ("setSinkId" in previewVideoPlayer) {
    try {
      await previewVideoPlayer.setSinkId(deviceId);
      showNotification("Audio output changed");
    } catch (error) {
      console.error("Error setting audio output:", error);
      showNotification("Failed to change audio output");
    }
  } else {
    showNotification("Audio output switching not supported in this browser");
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

  const videoDuration = previewVideoPlayer.duration;
  const duration =
    !isNaN(videoDuration) && videoDuration > 0
      ? videoDuration
      : videoMetadata.duration > 0
        ? videoMetadata.duration
        : 0;

  if (duration <= 0) {
    // Without a real duration, clip percentages would be computed against an
    // arbitrary fallback (previously 10s) and land in the wrong place.
    timelineContentWrapper.style.width = "100%";
    timelineDuration.textContent = "00:00:00";
    const hint = document.createElement("p");
    hint.className =
      "absolute inset-0 flex items-center justify-center text-xs text-gray-500 select-none";
    hint.textContent = "Load a video to place clips on the timeline";
    timelineTrack.appendChild(hint);
    return;
  }

  timelineContentWrapper.style.width = `${zoomLevel * 100}%`;

  drawRuler(duration);
  drawClips(duration);

  if (window.lucide) window.lucide.createIcons();
}

function drawClips(duration) {
  const activeClips = clips.length > 0 ? clips : jsonClips;
  activeClips.forEach((clip) => {
    const startSeconds = timeStringToSeconds(clip.inicio);
    const endSeconds = timeStringToSeconds(clip.fin);

    const startPercent = (startSeconds / duration) * 100;
    const durationPercent = ((endSeconds - startSeconds) / duration) * 100;

    const clipEl = document.createElement("div");
    clipEl.className =
      "absolute top-2 bottom-2 bg-accent-100/20 border border-accent-100/50 hover:bg-accent-100/40 hover:border-accent-100 cursor-pointer transition-colors rounded-sm group overflow-hidden shadow-sm";
    clipEl.style.left = `${startPercent}%`;
    clipEl.style.width = `${durationPercent}%`;

    clipEl.dataset.start = startSeconds;
    clipEl.dataset.end = endSeconds;

    const stripe = document.createElement("div");
    stripe.className =
      "absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)] pointer-events-none";
    clipEl.appendChild(stripe);

    const label = document.createElement("div");
    label.className =
      "absolute top-1 left-1 text-[10px] text-gray-200 font-bold truncate max-w-full px-1 drop-shadow-md pointer-events-none select-none";
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
    mark.className =
      "absolute top-0 bottom-0 border-l border-gray-600/50 pl-1 pt-1";
    mark.style.left = `${percent}%`;

    const label = document.createElement("span");
    label.textContent = formatTimeShort(seconds);
    mark.appendChild(label);

    timelineRuler.appendChild(mark);
  }
}

function formatTimeShort(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function updatePlayhead() {
  // Update subtitles on every time update
  updateSubtitles();

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

  // Snap against all known clip boundaries, not just project clips
  const snapClips = [...clips, ...jsonClips];
  for (const clip of snapClips) {
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

  // Seeking every mousemove storms the decoder on long videos; apply at most
  // one seek per animation frame (latest wins).
  pendingSeekTime = targetTime;
  if (pendingSeekHandle === null) {
    pendingSeekHandle = requestAnimationFrame(() => {
      pendingSeekHandle = null;
      if (pendingSeekTime !== null) {
        previewVideoPlayer.currentTime = pendingSeekTime;
        pendingSeekTime = null;
      }
    });
  }
}

let pendingSeekTime = null;
let pendingSeekHandle = null;

function handleScrubEnd(e) {
  if (isScrubbing) {
    isScrubbing = false;
    snapLine.classList.add("hidden");
    snapIndicator.classList.remove("opacity-100");
  }
}
