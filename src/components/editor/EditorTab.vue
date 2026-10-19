<script setup>
import { FileSpreadsheet } from "lucide-vue-next";
import TranscriptTable from "./TranscriptTable.vue";
import SelectionPanel from "./SelectionPanel.vue";
import ClipList from "./ClipList.vue";
import DropOverlay from "../DropOverlay.vue";
import { importCsvFile } from "../../services/importCsv.js";
import { useFileDrop } from "../../composables/useFileDrop.js";

const { dragging, handlers } = useFileDrop((dataTransfer) => {
  const file = dataTransfer.files[0];
  if (file) importCsvFile(file);
});
</script>

<template>
  <div class="relative flex h-full flex-col p-4" v-bind="handlers">
    <div class="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="flex h-full min-h-0 flex-col gap-4 lg:col-span-2">
        <TranscriptTable />
        <SelectionPanel />
      </div>
      <ClipList class="lg:col-span-1" />
    </div>

    <DropOverlay
      :visible="dragging"
      title="Drop CSV File Here"
      subtitle="Import transcriptions to start editing"
    >
      <FileSpreadsheet class="h-20 w-20 animate-bounce text-accent-100" />
    </DropOverlay>
  </div>
</template>
