import { useUiStore } from "../stores/ui.js";
import { importCsvFile } from "./importCsv.js";
import { openProject } from "./projectFile.js";
import { dropVideo, isVideoFile } from "./videoPicker.js";

/** Sends a dropped file to the right loader by type: CSV transcript, `.clpproj` project or video. */
export function routeDrop(dataTransfer) {
  const file = dataTransfer.files[0];
  if (!file) return;
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) importCsvFile(file);
  else if (name.endsWith(".clpproj")) openProject(file);
  else if (isVideoFile(file)) dropVideo(dataTransfer);
  else
    useUiStore().notify("Unsupported file. Drop a .csv transcript, a video or a .clpproj project.");
}
