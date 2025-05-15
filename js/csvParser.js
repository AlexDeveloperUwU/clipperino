import { showNotification } from "./ui.js";
import { setTranscriptions, transcriptions } from "./state.js";
import { renderTable, updateStatus } from "./editorTab.js";
import { saveToLocalStorage } from "./storage.js";

export function parseCSV(data, showLoadNotification = true) {
  const lines = data.split("\n");
  const hasHeader = lines[0].includes("inicio") || lines[0].includes("Inicio");

  if (showLoadNotification && lines.length > 500) {
    showNotification(`Cargando ${lines.length} líneas, por favor espere...`);
  }

  setTimeout(() => {
    processCSVBatches(lines, hasHeader ? 1 : 0, [], showLoadNotification);
  }, 10);
}

function processCSVBatches(lines, currentIndex, results, showLoadNotification = true) {
  const batchSize = 500;
  const endIndex = Math.min(currentIndex + batchSize, lines.length);

  for (let i = currentIndex; i < endIndex; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const parts = line.split(",");
    if (parts.length < 3) continue;

    results.push({
      inicio: parts[0].trim(),
      fin: parts[1].trim(),
      transcripcion: parts.slice(2).join(",").trim().replace(/^"|"$/g, ""),
    });
  }

  if (showLoadNotification && lines.length > 1000 && endIndex < lines.length) {
    const progress = Math.round((endIndex / lines.length) * 100);
    showNotification(`Procesando: ${progress}% completado...`);
  }

  if (endIndex < lines.length) {
    setTimeout(() => {
      processCSVBatches(lines, endIndex, results, showLoadNotification);
    }, 0);
  } else {
    setTranscriptions(results);
    renderTable();
    updateStatus();
    saveToLocalStorage();

    if (showLoadNotification && lines.length > 500) {
      showNotification(`${transcriptions.length} transcripciones cargadas correctamente`);
    }
  }
}

export function calculateDuration(start, end) {
  try {
    const [startMin, startSec] = start.split(":").map(Number);
    const [endMin, endSec] = end.split(":").map(Number);

    const startTotalSec = startMin * 60 + startSec;
    const endTotalSec = endMin * 60 + endSec;
    const durationSec = endTotalSec - startTotalSec;

    if (durationSec <= 0) return "00:00";

    const durationMin = Math.floor(durationSec / 60);
    const remainingSec = durationSec % 60;

    return `${durationMin.toString().padStart(2, "0")}:${remainingSec.toString().padStart(2, "0")}`;
  } catch (e) {
    return "00:00";
  }
}
