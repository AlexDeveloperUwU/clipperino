<script setup>
import { computed, ref, watch } from "vue";
import { ArrowDownToLine, ArrowUpToLine, List } from "@lucide/vue";
import SearchBar from "./SearchBar.vue";
import EmptyTranscript from "./EmptyTranscript.vue";
import { useProjectStore } from "../../stores/project.js";
import { useSearchStore } from "../../stores/search.js";
import { useUiStore } from "../../stores/ui.js";
import { useRowWindow } from "../../composables/useRowWindow.js";
import { highlightSegments } from "../../lib/text.js";

const FLASH_MS = 2000;

const project = useProjectStore();
const search = useSearchStore();
const ui = useUiStore();

const container = ref(null);
const flashIndex = ref(-1);
let flashTimer = null;

const total = computed(() => project.transcriptions.length);
const {
  start: windowStart,
  end: windowEnd,
  reset,
  scrollToRow,
  onScroll,
} = useRowWindow(container, () => total.value);

/** The rendered window of lines, each tagged with its position in the full transcript. */
const rows = computed(() =>
  project.transcriptions
    .slice(windowStart.value, windowEnd.value)
    .map((line, i) => ({ ...line, index: windowStart.value + i })),
);

watch(() => project.transcriptions, reset, { immediate: true });

/** Scrolls to a line and briefly highlights it. */
async function navigateTo(index) {
  if (index < 0 || total.value === 0) return;
  await scrollToRow(index);
  clearTimeout(flashTimer);
  flashIndex.value = index;
  flashTimer = setTimeout(() => (flashIndex.value = -1), FLASH_MS);
}

watch(
  () => ui.goToLine,
  ({ index }) => navigateTo(index),
);

/** Clicking anywhere on a free row toggles it (Shift extends the range), unless text is being selected. */
function onRowClick(index, event) {
  if (project.usedIndexSet.has(index) || window.getSelection()?.toString()) return;
  project.select(index, event.shiftKey);
}

/** CSS classes reflecting a row's flash, clip, selection and search state. */
function rowClass(row) {
  return {
    "highlight-row": flashIndex.value === row.index,
    "in-clip": project.usedIndexSet.has(row.index),
    "cursor-pointer": !project.usedIndexSet.has(row.index),
    "bg-accent-100/15": project.selectedIndexSet.has(row.index),
    "bg-yellow-900/20": search.matchSet.has(row.index),
  };
}
</script>

<template>
  <div data-tour="table" class="panel min-h-0 flex-1">
    <div class="panel-header">
      <h2 class="panel-title flex items-center gap-2">
        <List class="h-4 w-4 text-gray-500" /> Transcripts
      </h2>
      <div class="flex items-center gap-3">
        <div class="mr-1 flex items-center gap-1 border-r border-dark-50 pr-3">
          <button
            class="rounded p-1.5 text-gray-400 transition-colors hover:bg-dark-50 hover:text-white"
            title="Scroll to Top"
            @click="navigateTo(0)"
          >
            <ArrowUpToLine class="h-4 w-4" />
          </button>
          <button
            class="rounded p-1.5 text-gray-400 transition-colors hover:bg-dark-50 hover:text-white"
            title="Scroll to Bottom"
            @click="navigateTo(total - 1)"
          >
            <ArrowDownToLine class="h-4 w-4" />
          </button>
        </div>
        <SearchBar />
        <span class="font-mono text-xs text-gray-500">{{ total }} lines</span>
      </div>
    </div>

    <div ref="container" class="flex-1 overflow-y-auto bg-dark-300" @scroll="onScroll">
      <EmptyTranscript v-if="total === 0" class="fade-in" />
      <table v-else class="fade-in w-full border-collapse">
        <thead class="sticky top-0 z-10 bg-dark-100 shadow-sm">
          <tr class="text-left">
            <th class="th w-24">Start</th>
            <th class="th w-24">End</th>
            <th class="th">Transcript</th>
            <th class="th w-28 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-50">
          <tr
            v-for="row in rows"
            :key="row.index"
            :data-index="row.index"
            :class="rowClass(row)"
            class="border-b border-dark-50/30 transition-colors hover:bg-dark-100"
            @mousedown.shift.prevent
            @click="onRowClick(row.index, $event)"
          >
            <td class="td-time">
              {{ row.inicio }}
            </td>
            <td class="td-time">
              {{ row.fin }}
            </td>
            <td class="px-4 py-2 text-sm leading-relaxed">
              <template
                v-for="(part, i) in highlightSegments(row.transcripcion, search.activeTerm)"
                :key="i"
              >
                <span v-if="part.match" class="rounded bg-yellow-500/30 px-1 text-white">{{
                  part.text
                }}</span>
                <template v-else>{{ part.text }}</template>
              </template>
            </td>
            <td class="px-4 py-2 text-right text-sm">
              <span
                v-if="project.usedIndexSet.has(row.index)"
                class="inline-block border border-transparent px-2 py-1 text-xs font-medium text-gray-500"
                >Used</span
              >
              <button
                v-else
                :class="
                  project.selectedIndexSet.has(row.index)
                    ? 'border-transparent bg-accent-100 text-white'
                    : 'border-dark-50 bg-dark-100 text-gray-300 hover:bg-dark-50'
                "
                class="rounded border px-2 py-1 text-xs font-medium transition-colors"
              >
                {{ project.selectedIndexSet.has(row.index) ? "Selected" : "Select" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
