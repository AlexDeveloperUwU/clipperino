import { useProjectStore } from "../stores/project.js";
import { useUiStore } from "../stores/ui.js";

/** Reads a dropped or picked CSV file into the project, confirming first when it would replace existing work. */
export async function importCsvFile(file) {
  const ui = useUiStore();
  const project = useProjectStore();
  if (!file.name.toLowerCase().endsWith(".csv")) {
    ui.notify("Invalid file type. Please drop a CSV file.");
    return;
  }
  if (project.isActive) {
    const accepted = await ui.confirm({
      title: "Replace the transcript?",
      message: "Importing this CSV replaces the current transcript and removes its clips.",
      confirmLabel: "Replace",
    });
    if (!accepted) return;
  }
  project.importCsv(await file.text());
}
