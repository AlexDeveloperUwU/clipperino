const VOLUME_KEY = "clipperino_volume";

/** Last volume and mute state, or full volume when nothing valid is stored. */
export function readVolume() {
  try {
    const saved = JSON.parse(localStorage.getItem(VOLUME_KEY));
    const volume = Number(saved?.volume);
    return { volume: volume >= 0 && volume <= 1 ? volume : 1, muted: saved?.muted === true };
  } catch {
    return { volume: 1, muted: false };
  }
}

/** Remembers the volume and mute state; storage failures are logged, not thrown. */
export function writeVolume({ volume, muted }) {
  try {
    localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume, muted }));
  } catch (e) {
    console.warn("Could not save the volume:", e);
  }
}
