import { useMediaStore } from "../stores/media.js";
import { useProjectStore } from "../stores/project.js";
import { useUiStore } from "../stores/ui.js";

const NAME_MODAL = "name-clip";

/** Tour step bookkeeping: `enter` prepares a step, `isDone` says whether the user did what it asks. */
export function useTourProgress() {
  const ui = useUiStore();
  const project = useProjectStore();
  const media = useMediaStore();
  let clipCount = 0;

  function selectFreeLines(count) {
    project.clearSelection();
    for (let i = 0; i < project.transcriptions.length && project.selected.length < count; i++) {
      if (!project.usedIndexSet.has(i)) project.select(i, false);
    }
  }

  function ensureNewSelection() {
    if (project.editingClipIndex >= 0 || project.selected.length === 0) selectFreeLines(2);
  }

  function ensureEditing() {
    if (project.editingClipIndex < 0) project.editClip(0);
  }

  const BEFORE = {
    reset: () => {
      ui.close();
      project.clearSelection();
    },
    oneLine: () => {
      ui.close();
      if (project.selected.length !== 1) selectFreeLines(1);
    },
    ready: () => {
      ui.close();
      ensureNewSelection();
    },
    nameModal: () => {
      ensureNewSelection();
      if (ui.openModal !== NAME_MODAL) ui.open(NAME_MODAL);
    },
    editing: () => {
      ui.close();
      ensureEditing();
    },
    updateModal: () => {
      ensureEditing();
      if (project.editingClipIndex >= 0 && ui.openModal !== NAME_MODAL) ui.open(NAME_MODAL);
    },
    subtitlesOff: () => {
      media.showSubtitles = false;
    },
    pause: () => {
      media.element?.pause();
      media.paused = true;
    },
  };

  const UNTIL = {
    select: () => project.selected.length >= 1,
    range: () => ui.signals.has("range"),
    nameClip: () => ui.openModal === NAME_MODAL,
    savedClip: () => project.clips.length > clipCount,
    editClip: () => project.editingClipIndex >= 0,
    updatedClip: () => project.editingClipIndex < 0,
    export: () => ui.signals.has("export"),
    tabPreview: () => ui.activeTab === "preview",
    play: () => !media.paused,
    skip: () => ui.signals.has("skip"),
    subtitles: () => media.showSubtitles,
    volume: () => ui.signals.has("volume"),
    scrub: () => ui.signals.has("scrub"),
    keySeek: () => ui.signals.has("keySeek"),
    clipBlock: () => ui.signals.has("clipBlock"),
    zoom: () => ui.signals.has("zoom"),
    confirmOpen: () => ui.openModal === "confirm",
    videoCleared: () => !media.hasMedia && !media.meta.name,
    videoLoaded: () => media.elementDuration > 0,
  };

  const REQUIRES = {
    modal: (step) => ui.openModal === step.target,
    editing: () => project.editingClipIndex >= 0,
  };

  /** Applies a step's tab and setup, and snapshots what its completion check compares against. */
  function enter(step) {
    if (step.tab) ui.activeTab = step.tab;
    if (step.before) BEFORE[step.before]();
    clipCount = project.clips.length;
    if (step.until) ui.signals.delete(step.until);
  }

  /** Whether the step's action has happened; false for steps without one. */
  function isDone(step) {
    return step?.until ? UNTIL[step.until]() : false;
  }

  /** Whether the state a step relies on was lost (e.g. its dialog was cancelled). */
  function isBroken(step) {
    return step?.requires ? !REQUIRES[step.requires](step) : false;
  }

  return { enter, isDone, isBroken };
}
