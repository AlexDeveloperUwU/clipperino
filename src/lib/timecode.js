const pad2 = (n) => String(n).padStart(2, "0");

/** Parses `MM:SS` or `HH:MM:SS` into seconds; unknown shapes and non-numeric parts yield 0. */
export function timeToSeconds(timeString) {
  const parts = String(timeString).trim().split(":").map(Number);
  let seconds = 0;
  if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
  return Number.isFinite(seconds) ? seconds : 0;
}

/** Formats seconds as `HH:MM:SS`. */
export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

/** Formats seconds as `M:SS`, or `H:MM:SS` once past an hour. */
export function formatTimeShort(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}

/** Duration between two timecodes; negative spans clamp to zero. */
export function calculateDuration(start, end) {
  const totalSeconds = Math.max(0, timeToSeconds(end) - timeToSeconds(start));
  return { formatted: formatTime(totalSeconds), totalSeconds };
}

/** Shifts a timecode by one hour into `HH:MM:SS:00` (Resolve's timeline start). */
export function timecodeToEdl(timecode) {
  if (!timecode.includes(":")) return "01:00:00:00";

  const parts = timecode.split(":");
  let hour;
  let minute;
  let second;

  if (parts.length === 2) {
    hour = 0;
    [minute, second] = parts.map((p) => parseInt(p, 10));
  } else if (parts.length === 3) {
    [hour, minute, second] = parts.map((p) => parseInt(p, 10));
  } else {
    return "01:00:00:00";
  }

  hour = isNaN(hour) ? 1 : hour + 1;
  minute = isNaN(minute) ? 0 : minute;
  second = isNaN(second) ? 0 : second;

  return `${pad2(hour)}:${pad2(minute)}:${pad2(second)}:00`;
}
