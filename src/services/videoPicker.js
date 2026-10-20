import { useMediaStore } from "../stores/media.js";
import { useUiStore } from "../stores/ui.js";
import { clearVideoHandle, loadVideoHandle, saveVideoHandle } from "./handleStore.js";

const PICKER_ID = "clipperino-video";
const VIDEO_EXTENSIONS = [".mp4", ".m4v", ".mov", ".webm", ".mkv", ".avi"];
const VIDEO_TYPES = [{ description: "Video files", accept: { "video/*": VIDEO_EXTENSIONS } }];

/** Whether a file looks like a video, by MIME type or extension (some containers report no type). */
export function isVideoFile(file) {
  const name = file.name.toLowerCase();
  return file.type.startsWith("video/") || VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/** Reads access to a stored handle, asking the user once if the browser needs to. */
async function canRead(handle) {
  const options = { mode: "read" };
  return (
    (await handle.queryPermission(options)) === "granted" ||
    (await handle.requestPermission(options)) === "granted"
  );
}

/** The file behind a stored handle, or null when access was refused or the file is gone. */
async function reopen(handle) {
  try {
    return (await canRead(handle)) ? await handle.getFile() : null;
  } catch {
    return null;
  }
}

/**
 * Loads a video. Browsers with the File System Access API reopen the saved video directly
 * when it is the one the project expects, and otherwise open the picker in its folder;
 * other browsers need the caller's plain file input.
 * @returns {Promise<boolean>} False when the API is unavailable and the caller must use its file input.
 */
export async function openVideo() {
  if (!("showOpenFilePicker" in window)) return false;

  const media = useMediaStore();
  const saved = await loadVideoHandle();

  if (saved && media.needsReload && saved.name === media.meta.name) {
    const file = await reopen(saved);
    if (file) {
      media.load(file);
      return true;
    }
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      id: PICKER_ID,
      startIn: saved ?? "videos",
      types: VIDEO_TYPES,
    });
    media.load(await handle.getFile());
    await saveVideoHandle(handle);
  } catch (error) {
    if (error.name !== "AbortError") useUiStore().notify("Could not open that video");
  }
  return true;
}

/**
 * Loads the first dropped file as the video (the caller has already checked its type), and remembers its file handle where the browser provides one.
 * The handle must be requested before the first `await`, while the drop event is still live.
 */
export async function dropVideo(dataTransfer) {
  const file = dataTransfer.files[0];
  if (!file) return;

  const handlePending = dataTransfer.items[0]?.getAsFileSystemHandle?.();
  useMediaStore().load(file);

  const handle = await handlePending?.catch(() => null);
  if (handle?.kind === "file") await saveVideoHandle(handle);
}

/** Unloads the video and forgets where it came from. */
export async function forgetVideo() {
  useMediaStore().clear();
  await clearVideoHandle();
}
