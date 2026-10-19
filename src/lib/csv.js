const TIMECODE_START = /^\d+:\d+/;

/** RFC 4180 scanner: quoted fields may hold commas, newlines and `""` escapes. */
function parseRecords(data) {
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
    if (record.length > 1 || record[0] !== "") records.push(record);
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

/**
 * Parses a transcript CSV into `{ inicio, fin, transcripcion }` lines.
 * Columns are positional: start, end, then the text (extra columns are re-joined).
 */
export function parseCsv(data) {
  const records = parseRecords(data);
  const hasHeader = records.length > 0 && !TIMECODE_START.test(records[0][0]);

  const lines = [];
  for (let i = hasHeader ? 1 : 0; i < records.length; i++) {
    const columns = records[i];
    if (columns.length < 3) continue;
    lines.push({
      inicio: columns[0],
      fin: columns[1],
      transcripcion: columns.slice(2).join(",").trim(),
    });
  }
  return lines;
}
