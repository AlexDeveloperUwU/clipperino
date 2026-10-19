<script setup>
import { computed } from "vue";
import { FileSpreadsheet, Film } from "lucide-vue-next";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";

const props = defineProps({
  tab: { type: String, required: true },
});

const ui = useUiStore();

const GUIDES = {
  editor: {
    title: "Editor — How it works",
    icon: FileSpreadsheet,
    steps: [
      ["Import CSV", "load a transcript file using the button on the top right."],
      ["Select lines", "click a line, or hold Shift to select several at once."],
      ["Create a clip", "name your selection and save it. Saved clips appear in the side panel."],
      ["Export", "download your clips as JSON or EDL, or use Clear Data to start over."],
    ],
  },
  preview: {
    title: "Preview — How it works",
    icon: Film,
    steps: [
      ["Load Video", "pick or drop the video that matches your transcript."],
      ["Scrub the timeline", "drag the playhead, or use the zoom controls to look closer."],
      ["Jump to a clip", "click any clip block on the timeline to jump straight to it."],
      ["Subtitles", "they follow playback automatically and can be toggled on or off."],
    ],
  },
};

const guide = computed(() => GUIDES[props.tab]);
</script>

<template>
  <BaseModal :name="`help-${tab}`">
    <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-white">
      <component :is="guide.icon" class="h-5 w-5 text-accent-100" />
      {{ guide.title }}
    </h2>
    <ol class="mb-6 space-y-3 text-sm text-gray-300">
      <li v-for="([label, text], i) in guide.steps" :key="label" class="flex gap-3">
        <span
          class="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent-100/20 text-xs font-bold text-accent-100"
          >{{ i + 1 }}</span
        >
        <span
          ><span class="font-medium text-white">{{ label }}</span> — {{ text }}</span
        >
      </li>
    </ol>
    <div class="flex justify-end">
      <button class="btn-accent" @click="ui.close()">Got it</button>
    </div>
  </BaseModal>
</template>
