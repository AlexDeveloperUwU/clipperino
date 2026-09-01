import { showNotification } from "./ui.js";
import {
  setTranscriptions,
  transcriptions,
  jsonClips,
  clearLastViewedLine,
} from "./state.js";
import { renderTable, updateStatus } from "./editorTab.js";
import { saveToLocalStorage } from "./storage.js";
import { refreshViewer } from "./viewerTab.js";
import { renderTimeline } from "./previewTab.js";

export function parseCSV(data, showLoadNotification = true) {
  const records = parseCSVRecords(data);

  const headerLine =
    records.length > 0 ? records[0].join(",").toLowerCase() : "";
  const hasHeader =
    headerLine.includes("inicio") ||
    headerLine.includes("start") ||
    headerLine.includes("begin") ||
    headerLine.includes("transcripción") ||
    headerLine.includes("transcripcion") ||
    headerLine.includes("transcript") ||
    headerLine.includes("content");

  if (showLoadNotification && records.length > 500) {
    showNotification(`Loading ${records.length} lines, please wait...`);
  }

  setTimeout(() => {
    clearLastViewedLine();
    processCSVBatches(records, hasHeader ? 1 : 0, [], showLoadNotification);
  }, 10);
}

// RFC 4180 scanner: quoted fields may contain commas, newlines and escaped
// "" quotes. CRLF line endings are normalised and the trailing newline is
// not treated as an extra empty record.
function parseCSVRecords(data) {
  const records = [];
  let record = [];
  let field = "";
  let inQuotes = false;
  let fieldWasQuoted = false;

  const pushField = () => {
    record.push(fieldWasQuoted ? field : field.trim());
    field = "";
    fieldWasQuoted = false;
  };

  const pushRecord = () => {
    pushField();
    if (record.length > 1 || record[0] !== "") {
      records.push(record);
    }
    record = [];
  };

  for (let i = 0; i < data.length; i++) {
    const char = data[i];

    if (inQuotes) {
      if (char === '"') {
        if (data[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
          fieldWasQuoted = true;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      if (field.endsWith("\r")) field = field.slice(0, -1);
      pushRecord();
    } else {
      field += char;
    }
  }

  if (field !== "" || record.length > 0) {
    if (field.endsWith("\r")) field = field.slice(0, -1);
    pushRecord();
  }

  return records;
}

function processCSVBatches(
  records,
  currentIndex,
  results,
  showLoadNotification = true,
) {
  const batchSize = 500;
  const endIndex = Math.min(currentIndex + batchSize, records.length);

  for (let i = currentIndex; i < endIndex; i++) {
    const columns = records[i];
    if (columns.length < 3) continue;

    results.push({
      inicio: columns[0],
      fin: columns[1],
      transcripcion: columns.slice(2).join(",").trim(),
    });
  }

  if (endIndex < records.length) {
    setTimeout(() => {
      processCSVBatches(records, endIndex, results, showLoadNotification);
    }, 0);
  } else {
    setTranscriptions(results);
    renderTable();
    updateStatus();
    saveToLocalStorage();

    if (jsonClips.length > 0) {
      showNotification(
        "Project started — Viewer now mirrors your project clips",
      );
    }
    refreshViewer();
    renderTimeline();

    if (showLoadNotification && records.length > 500) {
      showNotification(
        `${transcriptions.length} transcripts loaded successfully`,
      );
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
        remainingSec,
      ).padStart(2, "0")}`,
      totalSeconds: durationSec,
    };
  } catch (e) {
    console.error("Error calculating duration:", e, { start, end });
    return { formatted: "00:00:00", totalSeconds: 0 };
  }
}
