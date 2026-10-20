import { useProjectStore } from "../stores/project.js";
import { useUiStore } from "../stores/ui.js";
import { clipsToEdl, clipsToJson } from "../lib/exporters.js";
import { downloadFile } from "./download.js";

const FORMATS = {
  json: { fileName: "clips.json", mimeType: "application/json", build: clipsToJson, label: "JSON" },
  edl: { fileName: "Timeline 1.edl", mimeType: "text/plain", build: clipsToEdl, label: "EDL" },
};

/** Downloads all clips as `json` or `edl`, or explains there is nothing to export. */
export function exportClips(kind) {
  const project = useProjectStore();
  const ui = useUiStore();
  if (project.clips.length === 0) {
    ui.notify("No clips to export");
    return;
  }
  const { fileName, mimeType, build, label } = FORMATS[kind];
  downloadFile(build(project.clips), fileName, mimeType);
  ui.notify(`Clips exported as ${label}`);
}
