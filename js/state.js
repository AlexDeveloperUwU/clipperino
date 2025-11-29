export let transcriptions = [];
export let clips = [];
export let selectedTranscriptions = [];
export let jsonClips = [];
export let isPlaying = false;
export let currentEditingClipIndex = -1;
export let lastSelectedIndex = -1;
export let lastViewedLineIndex = -1;

export function setTranscriptions(newTranscriptions) {
  transcriptions = newTranscriptions;
}

export function setClips(newClips) {
  clips = newClips;
}

export function setSelectedTranscriptions(newSelected) {
  selectedTranscriptions = newSelected;
}

export function setJsonClips(newJsonClips) {
  jsonClips = newJsonClips;
}

export function setIsPlaying(newIsPlaying) {
  isPlaying = newIsPlaying;
}

export function setCurrentEditingClipIndex(newIndex) {
  currentEditingClipIndex = newIndex;
}

export function setLastSelectedIndex(newIndex) {
  lastSelectedIndex = newIndex;
}

export function setLastViewedLineIndex(index) {
  lastViewedLineIndex = index;
  localStorage.setItem("clipperino_last_viewed_line", index);
}

export function clearLastViewedLine() {
  lastViewedLineIndex = -1;
  localStorage.removeItem("clipperino_last_viewed_line");
}