import { useProjectStore } from "../stores/project.js";
import { useUiStore } from "../stores/ui.js";

/** Reads a dropped or picked CSV file into the project. */
export async function importCsvFile(file) {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    useUiStore().notify("Invalid file type. Please drop a CSV file.");
    return;
  }
  useProjectStore().importCsv(await file.text());
}
