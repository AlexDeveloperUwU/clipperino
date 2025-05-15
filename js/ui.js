import {
  editorTabBtn,
  viewerTabBtn,
  editorTab,
  viewerTab,
  editorTabActions,
  viewerTabActions,
  playButton,
} from "./elements.js";
import { isPlaying, setIsPlaying } from "./state.js";

export function initUI() {
  editorTabBtn.addEventListener("click", () => {
    switchTab("editor");
  });

  viewerTabBtn.addEventListener("click", () => {
    switchTab("viewer");
  });

  playButton.addEventListener("click", togglePlay);

  setupMultiSelectHelp();
}

function setupMultiSelectHelp() {
  const multiSelectHelp = document.getElementById("multiSelectHelp");

  document.addEventListener("keydown", function (e) {
    if (e.key === "Shift" && !e.repeat) {
      multiSelectHelp.classList.add("visible");
    }
  });

  document.addEventListener("keyup", function (e) {
    if (e.key === "Shift") {
      multiSelectHelp.classList.remove("visible");
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      multiSelectHelp.classList.remove("visible");
    }
  });
}

export function switchTab(tabName) {
  if (tabName === "editor") {
    editorTab.classList.remove("hidden");
    viewerTab.classList.add("hidden");
    editorTabBtn.classList.add("border-accent-100", "text-white");
    editorTabBtn.classList.remove("border-transparent", "text-gray-400");
    viewerTabBtn.classList.add("border-transparent", "text-gray-400");
    viewerTabBtn.classList.remove("border-accent-100", "text-white");
    editorTabActions.classList.remove("hidden");
    viewerTabActions.classList.add("hidden");
  } else {
    editorTab.classList.add("hidden");
    viewerTab.classList.remove("hidden");
    viewerTabBtn.classList.add("border-accent-100", "text-white");
    viewerTabBtn.classList.remove("border-transparent", "text-gray-400");
    editorTabBtn.classList.add("border-transparent", "text-gray-400");
    editorTabBtn.classList.remove("border-accent-100", "text-white");
    viewerTabActions.classList.remove("hidden");
    editorTabActions.classList.add("hidden");
  }
}

export function togglePlay() {
  setIsPlaying(!isPlaying);
  playButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

export function showNotification(message) {
  const notification = document.createElement("div");
  notification.className =
    "fixed bottom-4 right-4 bg-dark-50 text-white px-4 py-3 rounded-lg shadow-lg z-50 fade-in flex items-center";
  notification.innerHTML = `
    <i class="fas fa-info-circle mr-2 text-accent-100"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(10px)";
    notification.style.transition = "opacity 0.3s, transform 0.3s";

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

export function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
