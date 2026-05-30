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
  editorTabGroup,
  viewerTabGroup,
  previewTabGroup,
  currentYear,
  appVersionDisplay,
  editorHelpBtn,
  previewHelpBtn,
  viewerHelpBtn,
  editorHelpModal,
  previewHelpModal,
  viewerHelpModal,
  editorHelpCloseBtn,
  previewHelpCloseBtn,
  viewerHelpCloseBtn,
  changelogModal,
  changelogCloseBtn,
  changelogContent,
  startupModal,
  startupLoadBtn,
  startupFreshBtn,
} from "./elements.js";
import { renderTimeline } from "./previewTab.js";
import { renderViewer } from "./viewerTab.js";
import {
  hasSavedData,
  loadFromLocalStorage,
  clearSavedData,
} from "./storage.js";
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
  setupHelpModals();
  setupChangelogModal();
  setupStartupPrompt();
  updateYear();
  updateVersionDisplay();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("opacity-100", "pointer-events-auto");
  modal.classList.remove("opacity-0", "pointer-events-none");
  const inner = modal.querySelector("div");
  if (inner) {
    inner.classList.remove("scale-95");
    inner.classList.add("scale-100");
  }
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("opacity-100", "pointer-events-auto");
  modal.classList.add("opacity-0", "pointer-events-none");
  const inner = modal.querySelector("div");
  if (inner) {
    inner.classList.add("scale-95");
    inner.classList.remove("scale-100");
  }
}

function setupHelpModals() {
  const pairs = [
    [editorHelpBtn, editorHelpModal, editorHelpCloseBtn],
    [previewHelpBtn, previewHelpModal, previewHelpCloseBtn],
    [viewerHelpBtn, viewerHelpModal, viewerHelpCloseBtn],
  ];

  pairs.forEach(([btn, modal, closeBtn]) => {
    if (!btn || !modal) return;
    btn.addEventListener("click", () => openModal(modal));
    if (closeBtn) closeBtn.addEventListener("click", () => closeModal(modal));
    // Click on the backdrop (the overlay itself, not its inner card) closes it.
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });
}

let cachedChangelog = null;

function setupChangelogModal() {
  if (!changelogModal) return;

  if (changelogCloseBtn) {
    changelogCloseBtn.addEventListener("click", () => closeModal(changelogModal));
  }
  changelogModal.addEventListener("click", (e) => {
    if (e.target === changelogModal) closeModal(changelogModal);
  });

  if (appVersionDisplay) {
    appVersionDisplay.addEventListener("click", async () => {
      if (cachedChangelog) {
        changelogContent.innerHTML = cachedChangelog;
        openModal(changelogModal);
        if (window.lucide) window.lucide.createIcons();
        return;
      }
      try {
        const res = await fetch("./CHANGELOG.md");
        if (!res.ok) throw new Error("Not found");
        const md = await res.text();
        cachedChangelog = window.marked ? window.marked.parse(md) : `<pre class="whitespace-pre-wrap">${md}</pre>`;
        changelogContent.innerHTML = cachedChangelog;
        openModal(changelogModal);
        if (window.lucide) window.lucide.createIcons();
      } catch {
        changelogContent.innerHTML = "<p class='text-gray-400'>Could not load changelog.</p>";
        openModal(changelogModal);
      }
    });
  }
}

function setupStartupPrompt() {
  if (!startupModal) return;

  if (startupLoadBtn) {
    startupLoadBtn.addEventListener("click", () => {
      closeModal(startupModal);
      loadFromLocalStorage();
    });
  }

  if (startupFreshBtn) {
    startupFreshBtn.addEventListener("click", () => {
      closeModal(startupModal);
      clearSavedData();
      renderViewer();
    });
  }
}

// Called after every tab has been initialised. When a previous session exists
// it prompts the user to load it or start fresh; otherwise the app starts empty.
export function runStartupFlow() {
  if (hasSavedData()) {
    openModal(startupModal);
  } else {
    renderViewer();
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
    if (
      e.key === "Shift" &&
      !shiftPressed &&
      !editorTab.classList.contains("hidden")
    ) {
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

// Each tab is a pill: a wrapper group holds the active/hover background while
// the inner tab button holds the label colour. Toggling both keeps the tab
// button and its help icon feeling like a single button.
function setTabActive(group, btn, isActive) {
  if (isActive) {
    group.classList.add("bg-dark-100");
    group.classList.remove("hover:bg-dark-50");
    btn.classList.add("text-white");
    btn.classList.remove("text-gray-400", "group-hover:text-white");
  } else {
    group.classList.remove("bg-dark-100");
    group.classList.add("hover:bg-dark-50");
    btn.classList.remove("text-white");
    btn.classList.add("text-gray-400", "group-hover:text-white");
  }
}

export function switchTab(tabName) {
  [editorTab, viewerTab, previewTab].forEach((tab) =>
    tab.classList.add("hidden"),
  );
  [editorTabActions, viewerTabActions, previewTabActions].forEach((action) =>
    action.classList.add("hidden"),
  );

  setTabActive(editorTabGroup, editorTabBtn, tabName === "editor");
  setTabActive(viewerTabGroup, viewerTabBtn, tabName === "viewer");
  setTabActive(previewTabGroup, previewTabBtn, tabName === "preview");

  if (tabName === "editor") {
    editorTab.classList.remove("hidden");
    editorTabActions.classList.remove("hidden");
  } else if (tabName === "viewer") {
    viewerTab.classList.remove("hidden");
    viewerTabActions.classList.remove("hidden");
  } else if (tabName === "preview") {
    previewTab.classList.remove("hidden");
    previewTabActions.classList.remove("hidden");
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
