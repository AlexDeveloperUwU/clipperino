import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useProjectStore } from "./project.js";
import { useUiStore } from "./ui.js";
import { MIN_SEARCH_LENGTH, findMatchIndices } from "../lib/text.js";

/** Case-insensitive search over transcript text with next/previous navigation. */
export const useSearchStore = defineStore("search", () => {
  const project = useProjectStore();
  const ui = useUiStore();

  const term = ref("");
  const current = ref(-1);

  /** The term, or "" while it is too short to search. */
  const activeTerm = computed(() => (term.value.length >= MIN_SEARCH_LENGTH ? term.value : ""));
  const matches = computed(() => findMatchIndices(project.transcriptions, activeTerm.value));
  const matchSet = computed(() => new Set(matches.value));

  /** Applies a new search term; only an empty result is toasted, as the search bar already shows the match count. */
  function setTerm(value) {
    term.value = value.trim();
    current.value = -1;
    if (activeTerm.value && matches.value.length === 0) ui.notify("No matches found");
  }

  /** Moves to the next (+1) or previous (-1) match, wrapping around. */
  function step(direction) {
    const total = matches.value.length;
    if (total === 0) return;
    current.value = (current.value + direction + total) % total;
    ui.navigateToLine(matches.value[current.value]);
  }

  /** Resets the search. */
  function clear() {
    term.value = "";
    current.value = -1;
  }

  return {
    activeTerm,
    current,
    matches,
    matchSet,
    setTerm,
    next: () => step(1),
    prev: () => step(-1),
    clear,
  };
});
