const FORMAT = "clipperino-project";
export const PROJECT_EXTENSION = ".clpproj";
const SCHEMA_VERSION = 1;

const hasCompression =
  typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

async function gzip(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(buffer) {
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

/** Serialises a session to a gzip blob body, or plain JSON where compression is unavailable. */
export async function encodeProject(data, appVersion) {
  const json = JSON.stringify({
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion,
    savedAt: new Date().toISOString(),
    data,
  });
  return {
    body: hasCompression ? await gzip(json) : json,
    mimeType: hasCompression ? "application/gzip" : "application/json",
  };
}

/**
 * Parses project file bytes, accepting gzip or plain JSON.
 * @returns {Promise<object | null>} The session data, or null when not a Clipperino project.
 */
export async function decodeProject(buffer) {
  let json;
  try {
    json = hasCompression ? await gunzip(buffer) : new TextDecoder().decode(buffer);
  } catch {
    json = new TextDecoder().decode(buffer);
  }
  const envelope = JSON.parse(json);
  return envelope?.format === FORMAT && envelope.data ? envelope.data : null;
}

/** Strips characters that are invalid in file names and the extension, if typed. */
export function sanitizeFileName(input) {
  const cleaned = Array.from(input.trim().replace(/\.clpproj$/i, ""))
    .filter((char) => char.charCodeAt(0) >= 32)
    .join("")
    .replace(/[<>:"/\\|?*]+/g, "_")
    .trim()
    .slice(0, 100);
  return cleaned || "project";
}

/** Default file name: `clipperino-<video name>-<date>`. */
export function suggestFileName(videoName, date = new Date()) {
  const base = (videoName || "project")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .slice(0, 60)
    .replace(/^_+|_+$/g, "");
  return `clipperino-${base || "project"}-${date.toISOString().slice(0, 10)}`;
}
