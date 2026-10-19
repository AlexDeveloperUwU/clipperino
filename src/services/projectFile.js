import { useProjectStore } from "../stores/project.js";
import { useMediaStore } from "../stores/media.js";
import { useUiStore } from "../stores/ui.js";
import { downloadFile } from "./download.js";
import {
  PROJECT_EXTENSION,
  decodeProject,
  encodeProject,
  sanitizeFileName,
  suggestFileName,
} from "../lib/projectFormat.js";

/** Default name offered in the save dialog. */
export function suggestProjectName() {
  return suggestFileName(useMediaStore().meta.name);
}

/** Downloads the session as a `.clpproj` file; resolves to whether it succeeded. */
export async function saveProject(rawName) {
  const project = useProjectStore();
  const media = useMediaStore();
  const ui = useUiStore();

  try {
    const { body, mimeType } = await encodeProject(
      {
        transcriptions: project.transcriptions,
        clips: project.clips,
        selectedTranscriptions: project.selected,
        videoMetadata: media.meta,
        lastViewedLineIndex: project.lastViewedLine,
      },
      __APP_VERSION__,
    );
    downloadFile(body, `${sanitizeFileName(rawName)}${PROJECT_EXTENSION}`, mimeType);
    ui.notify("Project saved");
    return true;
  } catch (e) {
    console.error("Error saving project:", e);
    ui.notify("Error saving project");
    return false;
  }
}

/** Opens a project file, confirming first when it would replace live work. */
export async function openProject(file) {
  const project = useProjectStore();
  const media = useMediaStore();
  const ui = useUiStore();

  let data;
  try {
    data = await decodeProject(await file.arrayBuffer());
  } catch (e) {
    console.error("Error opening project:", e);
    ui.notify("Error opening project file");
    return;
  }
  if (!data) {
    ui.notify("Invalid or unrecognized project file");
    return;
  }

  const replace =
    !project.isActive ||
    (await ui.confirm({
      title: "Replace current session?",
      message:
        "Opening this project will replace your current session (transcript, clips and selection).",
      confirmLabel: "Open project",
    }));
  if (!replace) return;

  project.restore({
    transcriptions: data.transcriptions,
    clips: data.clips,
    selected: data.selectedTranscriptions,
    lastViewedLine: data.lastViewedLineIndex,
  });
  media.clear({ silent: true });
  media.restoreMeta(data.videoMetadata);
  ui.activeTab = "editor";
  ui.notify("Project loaded");
  if (project.lastViewedLine >= 0) ui.navigateToLine(project.lastViewedLine);
}
