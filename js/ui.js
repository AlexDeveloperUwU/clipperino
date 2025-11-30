import {
  editorTabBtn,
  viewerTabBtn,
  previewTabBtn,
  editorTab,
  viewerTab,
  previewTab,
  editorTabActions,
  viewerTabActions,
  previewTabActions,
  currentYear,
  appVersionDisplay
} from "./elements.js";
import { renderTimeline } from "./previewTab.js";
import { APP_VERSION } from "./state.js";

export function initUI() {
  editorTabBtn.addEventListener("click", () => {
    switchTab("editor");
  });

  viewerTabBtn.addEventListener("click", () => {
    switchTab("viewer");
  });

  previewTabBtn.addEventListener("click", () => {
    switchTab("preview");
    renderTimeline();
  });

  setupMultiSelectHelp();
  updateYear();
  updateVersionDisplay();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function updateVersionDisplay() {
  if (appVersionDisplay) {
    appVersionDisplay.textContent = `Clipperino v${APP_VERSION}`;
  }
}

function setupMultiSelectHelp() {
  const multiSelectHelp = document.getElementById("multiSelectHelp");
  if (!multiSelectHelp) return;

  multiSelectHelp.classList.remove("visible");

  let shiftPressed = false;

  document.addEventListener("keydown", function (e) {
    if (e.key === "Shift" && !shiftPressed) {
      shiftPressed = true;
      multiSelectHelp.classList.add("visible");
    }
  });

  document.addEventListener("keyup", function (e) {
    if (e.key === "Shift") {
      shiftPressed = false;
      multiSelectHelp.classList.remove("visible");
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      shiftPressed = false;
      multiSelectHelp.classList.remove("visible");
    }
  });

  document.addEventListener("click", function () {
    if (shiftPressed) {
      setTimeout(() => {
        multiSelectHelp.classList.remove("visible");
      }, 1000);
    }
  });
}

export function switchTab(tabName) {
  [editorTab, viewerTab, previewTab].forEach(tab => tab.classList.add("hidden"));
  [editorTabActions, viewerTabActions, previewTabActions].forEach(action => action.classList.add("hidden"));

  const btns = [editorTabBtn, viewerTabBtn, previewTabBtn];
  btns.forEach(btn => {
    btn.classList.remove("bg-dark-100", "text-white");
    btn.classList.add("text-gray-400", "hover:text-white", "hover:bg-dark-50");
  });

  if (tabName === "editor") {
    editorTab.classList.remove("hidden");
    editorTabActions.classList.remove("hidden");

    editorTabBtn.classList.add("bg-dark-100", "text-white");
    editorTabBtn.classList.remove("text-gray-400", "hover:text-white", "hover:bg-dark-50");
  } else if (tabName === "viewer") {
    viewerTab.classList.remove("hidden");
    viewerTabActions.classList.remove("hidden");

    viewerTabBtn.classList.add("bg-dark-100", "text-white");
    viewerTabBtn.classList.remove("text-gray-400", "hover:text-white", "hover:bg-dark-50");
  } else if (tabName === "preview") {
    previewTab.classList.remove("hidden");
    previewTabActions.classList.remove("hidden");

    previewTabBtn.classList.add("bg-dark-100", "text-white");
    previewTabBtn.classList.remove("text-gray-400", "hover:text-white", "hover:bg-dark-50");
  }

  if (window.lucide) window.lucide.createIcons();
}

export function showNotification(message) {
  const notification = document.createElement("div");
  notification.className =
    "fixed bottom-4 right-4 bg-dark-50 text-white px-4 py-3 rounded-lg shadow-lg z-50 fade-in flex items-center border border-dark-50";
  notification.innerHTML = `
    <i data-lucide="info" class="mr-2 text-accent-100 w-5 h-5"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  if (window.lucide) window.lucide.createIcons();

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

export function updateYear() {
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }
}