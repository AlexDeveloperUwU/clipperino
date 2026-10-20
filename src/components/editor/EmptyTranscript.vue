<script setup>
import { FileSpreadsheet } from "@lucide/vue";
import { importCsvFile } from "../../services/importCsv.js";
import { startTour } from "../../services/demo.js";
import { useFilePicker } from "../../composables/useFilePicker.js";

const { input, open, onChange } = useFilePicker(importCsvFile);
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
      <button class="btn-accent" @click="open">Import CSV</button>
      <button class="btn-neutral" @click="startTour">Take the interactive tour</button>
    </div>
    <input ref="input" type="file" class="hidden" accept=".csv" @change="onChange" />
  </div>
</template>
