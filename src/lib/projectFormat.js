const FORMAT = "clipperino-project";
export const PROJECT_EXTENSION = ".clpproj";
const SCHEMA_VERSION = 1;

/** The project file envelope; `savedAt` is an ISO timestamp supplied by the caller. */
export function buildEnvelope(data, appVersion, savedAt) {
  return { format: FORMAT, schemaVersion: SCHEMA_VERSION, appVersion, savedAt, data };
}

/** The session data inside a parsed envelope, or null when it is not a Clipperino project. */
export function parseEnvelope(envelope) {
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
export function suggestFileName(videoName, date) {
  const base = (videoName || "project")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .slice(0, 60)
    .replace(/^_+|_+$/g, "");
  return `clipperino-${base || "project"}-${date.toISOString().slice(0, 10)}`;
}
