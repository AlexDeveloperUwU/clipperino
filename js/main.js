import { initUI, runStartupFlow } from "./ui.js";
import { initEditorTab, navigateToLine } from "./editorTab.js";
import { initViewerTab } from "./viewerTab.js";
import { initPreviewTab } from "./previewTab.js";
import { initSearch } from "./search.js";
import { initProjectFile } from "./projectFile.js";

window.navigateToLine = navigateToLine;

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  initEditorTab();
  initViewerTab();
  initPreviewTab();
  initSearch();
  initProjectFile();
  runStartupFlow();
});
