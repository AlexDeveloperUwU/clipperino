import { initUI } from "./ui.js";
import { initEditorTab, navigateToLine } from "./editorTab.js";
import { initViewerTab } from "./viewerTab.js";
import { initStorage } from "./storage.js";
import { initSearch } from "./search.js";

window.navigateToLine = navigateToLine;

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  initEditorTab();
  initViewerTab();
  initStorage();
  initSearch();
});
