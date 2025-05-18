import { showNotification } from "./ui.js";
import { setTranscriptions, transcriptions, clearLastViewedLine } from "./state.js";
import { renderTable, updateStatus } from "./editorTab.js";
import { saveToLocalStorage } from "./storage.js";

export function parseCSV(data, showLoadNotification = true) {
  const lines = data.split("\n");

  const hasHeader =
    lines[0].includes("Inicio") ||
    lines[0].includes("inicio") ||
    lines[0].includes("Transcripción") ||
    lines[0].includes("transcripción");

  if (showLoadNotification && lines.length > 500) {
    showNotification(`Cargando ${lines.length} líneas, por favor espere...`);
  }

  setTimeout(() => {
    clearLastViewedLine();
    processCSVBatches(lines, hasHeader ? 1 : 0, [], showLoadNotification);
  }, 10);
}

function processCSVBatches(lines, currentIndex, results, showLoadNotification = true) {
  const batchSize = 500;
  const endIndex = Math.min(currentIndex + batchSize, lines.length);

  for (let i = currentIndex; i < endIndex; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    let columns = [];
    let inQuote = false;
    let currentCol = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"' && (j === 0 || line[j - 1] !== "\\")) {
        inQuote = !inQuote;
      } else if (char === "," && !inQuote) {
        columns.push(currentCol.trim());
        currentCol = "";
      } else {
        currentCol += char;
      }
    }

    columns.push(currentCol.trim());

    if (columns.length < 3) {
      columns = line.split(",");
    }

    if (columns.length < 3) continue;

    const inicio = columns[0].replace(/"/g, "").trim();
    const fin = columns[1].replace(/"/g, "").trim();
    const transcripcion = columns.slice(2).join(",").replace(/^"|"$/g, "").trim();

    results.push({
      inicio,
      fin,
      transcripcion,
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
    let startHour = 0,
      startMin = 0,
      startSec = 0;
    let endHour = 0,
      endMin = 0,
      endSec = 0;

    const startParts = start.trim().split(":").map(Number);
    const endParts = end.trim().split(":").map(Number);

    if (startParts.length === 2) {
      [startMin, startSec] = startParts;
    } else if (startParts.length === 3) {
      [startHour, startMin, startSec] = startParts;
    }

    if (endParts.length === 2) {
      [endMin, endSec] = endParts;
    } else if (endParts.length === 3) {
      [endHour, endMin, endSec] = endParts;
    }

    const startTotalSec = startHour * 3600 + startMin * 60 + startSec;
    const endTotalSec = endHour * 3600 + endMin * 60 + endSec;
    const durationSec = endTotalSec - startTotalSec;

    if (durationSec <= 0) return { formatted: "00:00:00", totalSeconds: 0 };

    const durationHour = Math.floor(durationSec / 3600);
    const durationMin = Math.floor((durationSec % 3600) / 60);
    const remainingSec = durationSec % 60;

    return {
      formatted: `${String(durationHour).padStart(2, "0")}:${String(durationMin).padStart(2, "0")}:${String(
        remainingSec
      ).padStart(2, "0")}`,
      totalSeconds: durationSec,
    };
  } catch (e) {
    console.error("Error calculating duration:", e, { start, end });
    return { formatted: "00:00:00", totalSeconds: 0 };
  }
}
