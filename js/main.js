import { initUI } from "./ui.js";
import { initEditorTab } from "./editorTab.js";
import { initViewerTab } from "./viewerTab.js";
import { initStorage } from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  initEditorTab();
  initViewerTab();
  initStorage();
});
