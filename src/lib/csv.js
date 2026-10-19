const TIMECODE_START = /^\d+:\d+/;

/** RFC 4180 scanner: quoted fields may hold commas, newlines and `""` escapes. */
function parseRecords(data, delimiter) {
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
    } else if (char === delimiter) {
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

/** Picks `;` over `,` when the first line has more of them (Excel in comma-decimal locales). */
function sniffDelimiter(data) {
  const firstLine = data.slice(0, data.indexOf("\n") + 1 || data.length);
  const count = (char) => firstLine.split(char).length - 1;
  return count(";") > count(",") ? ";" : ",";
}

/**
 * Parses a transcript CSV into `{ inicio, fin, transcripcion }` lines plus the number of
 * rows skipped for having fewer than three columns or an invalid start time.
 * Columns are positional: start, end, then the text (extra columns are re-joined).
 */
export function parseCsv(data) {
  const text = data.charCodeAt(0) === 0xfeff ? data.slice(1) : data;
  const delimiter = sniffDelimiter(text);
  const records = parseRecords(text, delimiter);
  const hasHeader = records.length > 0 && !TIMECODE_START.test(records[0][0]);

  const lines = [];
  let skipped = 0;
  for (let i = hasHeader ? 1 : 0; i < records.length; i++) {
    const columns = records[i];
    if (columns.length < 3 || !TIMECODE_START.test(columns[0])) {
      skipped++;
      continue;
    }
    lines.push({
      inicio: columns[0],
      fin: columns[1],
      transcripcion: columns.slice(2).join(delimiter).trim(),
    });
  }
  return { lines, skipped };
}
