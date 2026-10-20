import { useProjectStore } from "../stores/project.js";
import { useMediaStore } from "../stores/media.js";
import { useUiStore } from "../stores/ui.js";
import { downloadFile } from "./download.js";
import {
  PROJECT_EXTENSION,
  buildEnvelope,
  parseEnvelope,
  sanitizeFileName,
  suggestFileName,
} from "../lib/projectFormat.js";

const hasCompression =
  typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

async function gzip(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(buffer) {
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

/** Serialises a session to a gzip blob body, or plain JSON where compression is unavailable. */
async function encodeProject(data, appVersion) {
  const json = JSON.stringify(buildEnvelope(data, appVersion, new Date().toISOString()));
  return {
    body: hasCompression ? await gzip(json) : json,
    mimeType: hasCompression ? "application/gzip" : "application/json",
  };
}

/**
 * Parses project file bytes, accepting gzip or plain JSON.
 * @returns {Promise<object | null>} The session data, or null when not a Clipperino project.
 */
async function decodeProject(buffer) {
  let json;
  try {
    json = hasCompression ? await gunzip(buffer) : new TextDecoder().decode(buffer);
  } catch {
    json = new TextDecoder().decode(buffer);
  }
  return parseEnvelope(JSON.parse(json));
}

/** Default name offered in the save dialog. */
export function suggestProjectName() {
  return suggestFileName(useMediaStore().meta.name, new Date());
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
