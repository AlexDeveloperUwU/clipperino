<script setup>
import { ref } from "vue";
import { FileSpreadsheet } from "@lucide/vue";
import { useUiStore } from "../../stores/ui.js";
import { importCsvFile } from "../../services/importCsv.js";
import { loadDemo } from "../../services/demo.js";

const ui = useUiStore();
const input = ref(null);

/** Imports the picked file and resets the input so the same file can be picked again. */
function onPick(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (file) importCsvFile(file);
}
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
    <FileSpreadsheet class="h-12 w-12 text-gray-600" aria-hidden="true" />
    <div>
      <h3 class="mb-1 text-lg font-bold text-gray-300">No transcript yet</h3>
      <p class="text-sm text-gray-500">
        Import a CSV with three columns — start, end, text — or drop it anywhere on this page.
      </p>
    </div>
    <pre
      class="rounded border border-dark-50 bg-dark-200 px-4 py-3 text-left font-mono text-xs text-gray-400"
    >
00:00:05,00:00:09,Welcome everyone
00:00:09,00:00:14,Let's get started</pre>
    <div class="flex flex-wrap items-center justify-center gap-3">
      <button class="btn-accent" @click="input.click()">Import CSV</button>
      <button
        class="rounded bg-dark-100 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-dark-50 hover:text-white"
        @click="loadDemo"
      >
        Try the demo
      </button>
      <button
        class="px-2 py-2 text-sm text-gray-500 transition-colors hover:text-gray-300"
        @click="ui.startTour()"
      >
        Take the tour
      </button>
    </div>
    <input ref="input" type="file" class="hidden" accept=".csv" @change="onPick" />
  </div>
</template>
