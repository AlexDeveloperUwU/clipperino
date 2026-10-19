<script setup>
import TranscriptTable from "./TranscriptTable.vue";
import SelectionPanel from "./SelectionPanel.vue";
import ClipList from "./ClipList.vue";
</script>

<template>
  <div class="flex h-full flex-col p-4">
    <div class="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="flex h-full min-h-0 flex-col gap-4 lg:col-span-2">
        <TranscriptTable />
        <SelectionPanel />
      </div>
      <ClipList class="lg:col-span-1" />
    </div>
  </div>
</template>
