export function timecodeToEDLFormat(timecode) {
  if (!timecode.includes(":")) {
    return "01:00:00:00";
  }

  const parts = timecode.split(":");
  let hour, minute, second;

  if (parts.length === 2) {
    hour = 0;
    [minute, second] = parts.map((p) => parseInt(p, 10));
  } else if (parts.length === 3) {
    [hour, minute, second] = parts.map((p) => parseInt(p, 10));
  } else {
    return "01:00:00:00";
  }

  hour = hour + 1;
  hour = isNaN(hour) ? 1 : hour;
  minute = isNaN(minute) ? 0 : minute;
  second = isNaN(second) ? 0 : second;

  const pad = (num) => num.toString().padStart(2, "0");
  return `${pad(hour)}:${pad(minute)}:${pad(second)}:00`;
}

const RESOLVE_COLORS = [
  "ResolveColorBlue",
  "ResolveColorCyan",
  "ResolveColorGreen",
  "ResolveColorYellow",
  "ResolveColorRed",
  "ResolveColorPink",
  "ResolveColorPurple",
  "ResolveColorFuchsia",
  "ResolveColorRose",
  "ResolveColorLavender",
  "ResolveColorSky",
  "ResolveColorMint",
  "ResolveColorLemon",
  "ResolveColorSand",
  "ResolveColorCocoa",
  "ResolveColorCream",
];

export function convertClipsToEDL(clips) {
  const header = "TITLE: Timeline 1\nFCM: NON-DROP FRAME\n\n";
  let edlContent = "";
  let editNumber = 1;

  clips.forEach((clip, index) => {
    const colorIndex = index % RESOLVE_COLORS.length;
    const clipColor = RESOLVE_COLORS[colorIndex];

    const startEditNumber = editNumber.toString().padStart(3, "0");
    const startTime = timecodeToEDLFormat(clip.inicio);
    const startTimeNextFrame = startTime.slice(0, -2) + "01";

    let description = "";
    if (clip.transcriptions && clip.transcriptions.length > 0) {
      description = clip.transcriptions[0].transcripcion || "";
    }

    edlContent += `${startEditNumber}  001      V     C        ${startTime} ${startTimeNextFrame} ${startTime} ${startTimeNextFrame}  \n`;
    edlContent += `${description} |C:${clipColor} |M:${clip.name} - Start |D:1\n\n`;

    editNumber++;

    const endEditNumber = editNumber.toString().padStart(3, "0");
    const endTime = timecodeToEDLFormat(clip.fin);
    const endTimeNextFrame = endTime.slice(0, -2) + "01";

    edlContent += `${endEditNumber}  001      V     C        ${endTime} ${endTimeNextFrame} ${endTime} ${endTimeNextFrame}  \n`;
    edlContent += `${description} |C:${clipColor} |M:${clip.name} - End |D:1\n\n`;

    editNumber++;
  });

  return header + edlContent;
}

export function exportEDL(clips) {
  if (!clips || clips.length === 0) {
    return null;
  }

  try {
    const edlContent = convertClipsToEDL(clips);
    const blob = new Blob([edlContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Timeline 1.edl";
    a.click();

    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error exporting EDL:", error);
    return false;
  }
}