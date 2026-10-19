import { timecodeToEdl } from "./timecode.js";

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

/** Clips as pretty-printed JSON, without internal fields such as line indices. */
export function clipsToJson(clips) {
  return JSON.stringify(
    clips.map((clip) => ({
      name: clip.name,
      inicio: clip.inicio,
      fin: clip.fin,
      duration: clip.duration,
      totalSeconds: clip.totalSeconds || 0,
      transcriptions: clip.transcriptions.map((t) => ({
        inicio: t.inicio,
        fin: t.fin,
        transcripcion: t.transcripcion,
      })),
    })),
    null,
    2,
  );
}

/** One-frame start and end markers per clip, coloured for DaVinci Resolve. */
export function clipsToEdl(clips) {
  let edl = "TITLE: Timeline 1\nFCM: NON-DROP FRAME\n\n";
  let editNumber = 1;

  const marker = (timecode, clip, color, label, description) => {
    const start = timecodeToEdl(timecode);
    const next = start.slice(0, -2) + "01";
    const n = String(editNumber++).padStart(3, "0");
    return (
      `${n}  001      V     C        ${start} ${next} ${start} ${next}  \n` +
      `${description} |C:${color} |M:${clip.name} - ${label} |D:1\n\n`
    );
  };

  clips.forEach((clip, index) => {
    const color = RESOLVE_COLORS[index % RESOLVE_COLORS.length];
    const description = clip.transcriptions?.[0]?.transcripcion || "";
    edl += marker(clip.inicio, clip, color, "Start", description);
    edl += marker(clip.fin, clip, color, "End", description);
  });

  return edl;
}
