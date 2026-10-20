import { computed, ref, shallowRef } from "vue";
import { defineStore } from "pinia";
import { parseCsv } from "../lib/csv.js";
import { buildClip } from "../lib/clips.js";
import { timeToSeconds } from "../lib/timecode.js";
import { useUiStore } from "./ui.js";

const asList = (value) => (Array.isArray(value) ? value : []);

/**
 * Transcript lines, selection and clips. Arrays are replaced, never mutated,
 * so shallow refs are enough and large transcripts stay cheap to track.
 */
export const useProjectStore = defineStore("project", () => {
  const ui = useUiStore();

  const transcriptions = shallowRef([]);
  const clips = shallowRef([]);
  const selected = shallowRef([]);
  const lastSelectedIndex = ref(-1);
  const editingClipIndex = ref(-1);
  const lastViewedLine = ref(-1);
  const demoActive = ref(false);

  const isActive = computed(() => transcriptions.value.length > 0 || clips.value.length > 0);
  const selectedIndexSet = computed(() => new Set(selected.value.map((t) => t.index)));
  const sortedSelected = computed(() => [...selected.value].sort((a, b) => a.index - b.index));
  /** Latest end time, in seconds, across transcript lines and clips. */
  const endSeconds = computed(() => {
    let end = 0;
    for (const line of transcriptions.value) end = Math.max(end, timeToSeconds(line.fin));
    for (const clip of clips.value) end = Math.max(end, timeToSeconds(clip.fin));
    return end;
  });
  /** Line indices already in a clip; the clip being edited is excluded. */
  const usedIndexSet = computed(() => {
    const set = new Set();
    clips.value.forEach((clip, i) => {
      if (i === editingClipIndex.value) return;
      clip.transcriptions.forEach((t) => set.add(t.index));
    });
    return set;
  });

  /**
   * Replaces the transcript (and its clips, whose line indices would go stale) with the parsed CSV.
   * A CSV without valid rows leaves the current project untouched.
   */
  function importCsv(text) {
    const { lines, skipped } = parseCsv(text);
    if (!lines.length) {
      ui.notify(
        "No valid rows found. Expected columns: start, end, text (e.g. 00:01:05,00:01:09,Hello).",
      );
      return;
    }
    restore({ transcriptions: lines });
    ui.notify(
      skipped
        ? `${lines.length} lines imported, ${skipped} skipped`
        : `${lines.length} lines imported`,
    );
  }

  /** Adds or removes one line from the selection. */
  function toggleSelect(index) {
    const line = transcriptions.value[index];
    if (!line || usedIndexSet.value.has(index)) return;
    selected.value = selectedIndexSet.value.has(index)
      ? selected.value.filter((t) => t.index !== index)
      : [...selected.value, { ...line, index }];
    lastSelectedIndex.value = index;
    lastViewedLine.value = index;
  }

  /** Adds every unselected line between two indices (inclusive, either order). */
  function selectRange(from, to) {
    const start = Math.min(from, to);
    const end = Math.min(Math.max(from, to), transcriptions.value.length - 1);
    const next = [...selected.value];
    let added = 0;
    for (let i = start; i <= end; i++) {
      if (selectedIndexSet.value.has(i) || usedIndexSet.value.has(i)) continue;
      next.push({ ...transcriptions.value[i], index: i });
      added++;
    }
    selected.value = next;
    lastSelectedIndex.value = end;
    if (added > 0) {
      ui.notify(`${added} lines selected`);
      ui.signal("range");
    }
  }

  /** Plain click toggles one line; with Shift it extends from the last click. */
  function select(index, shiftKey) {
    if (shiftKey && lastSelectedIndex.value >= 0) {
      selectRange(lastSelectedIndex.value, index);
    } else {
      toggleSelect(index);
    }
  }

  /** Drops one line, by transcript index, from the selection. */
  function removeSelected(index) {
    selected.value = selected.value.filter((t) => t.index !== index);
  }

  /** Empties the selection and leaves clip-edit mode. */
  function clearSelection() {
    selected.value = [];
    lastSelectedIndex.value = -1;
    editingClipIndex.value = -1;
  }

  /**
   * Creates a clip from the selection, or updates the clip being edited.
   * @returns {boolean} False when nothing is selected.
   */
  function saveClip(name) {
    if (selected.value.length === 0) {
      ui.notify("Select at least one transcript to create a clip");
      return false;
    }

    const clip = buildClip(selected.value, name, new Date().toISOString());
    const next = [...clips.value];
    if (editingClipIndex.value >= 0) {
      next[editingClipIndex.value] = clip;
      ui.notify("Clip updated successfully");
    } else {
      next.push(clip);
      ui.notify("Clip saved successfully");
    }
    clips.value = next;
    clearSelection();
    return true;
  }

  /** @returns {boolean} False when the new name is blank. */
  function renameClip(index, name) {
    const trimmed = name.trim();
    if (!trimmed) {
      ui.notify("Clip name cannot be empty");
      return false;
    }
    clips.value = clips.value.map((c, i) => (i === index ? { ...c, name: trimmed } : c));
    ui.notify("Clip name updated");
    return true;
  }

  /** Deletes a clip, leaving edit mode if it was the one being edited. */
  function removeClip(index) {
    if (index === editingClipIndex.value) clearSelection();
    else if (editingClipIndex.value > index) editingClipIndex.value--;
    clips.value = clips.value.filter((_, i) => i !== index);
  }

  /** Loads a clip's lines into the selection so they can be adjusted. */
  function editClip(index) {
    const clip = clips.value[index];
    if (!clip) return;
    editingClipIndex.value = index;
    selected.value = [...clip.transcriptions];
    lastSelectedIndex.value = -1;
    if (clip.transcriptions.length > 0) {
      ui.navigateToLine(clip.transcriptions[0].index);
    }
    ui.notify(`Editing clip: ${clip.name}`);
  }

  /** Wipes transcript, selection and clips. */
  function clearAll() {
    restore({});
    ui.notify("All data cleared successfully");
  }

  /**
   * Replaces the whole session, ignoring fields of the wrong type.
   * @param {{ transcriptions?: unknown, clips?: unknown, selected?: unknown, lastViewedLine?: unknown }} data
   */
  function restore(data) {
    demoActive.value = false;
    transcriptions.value = asList(data.transcriptions);
    clips.value = asList(data.clips);
    selected.value = asList(data.selected);
    lastSelectedIndex.value = -1;
    editingClipIndex.value = -1;
    const last = data.lastViewedLine;
    lastViewedLine.value = typeof last === "number" && last >= 0 ? last : -1;
  }

  /** Marks the loaded session as the bundled demo, which is never autosaved. */
  function setDemoActive(value) {
    demoActive.value = value;
  }

  return {
    transcriptions,
    clips,
    selected,
    editingClipIndex,
    lastViewedLine,
    demoActive,
    isActive,
    endSeconds,
    selectedIndexSet,
    sortedSelected,
    usedIndexSet,
    importCsv,
    select,
    removeSelected,
    clearSelection,
    saveClip,
    renameClip,
    removeClip,
    editClip,
    clearAll,
    restore,
    setDemoActive,
  };
});
