<script setup>
import { computed } from "vue";
import { FileSpreadsheet, Film } from "@lucide/vue";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";
import { loadDemo } from "../../services/demo.js";

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
    notes: [
      [
        "CSV format",
        "three columns — start, end, text — with times as HH:MM:SS or MM:SS. A header row is optional; commas and semicolons both work.",
      ],
      [
        "Saving",
        "your session is autosaved in this browser. Save Project writes a portable .clpproj file.",
      ],
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
    notes: [
      [
        "Video length",
        "the video must be at least as long as the transcript, otherwise it is rejected as the wrong file.",
      ],
      ["Keyboard", "Space plays or pauses when no button or field has focus."],
      ["EDL", "the exported timeline imports into DaVinci Resolve and Premiere."],
    ],
  },
};

const guide = computed(() => GUIDES[props.tab]);
</script>

<template>
  <BaseModal :name="`help-${tab}`">
    <h2 class="modal-title mb-4">
      <component :is="guide.icon" class="h-5 w-5 text-accent-100" />
      {{ guide.title }}
    </h2>
    <ol class="mb-4 space-y-3 text-sm text-gray-300">
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
    <ul class="mb-6 space-y-2 border-t border-dark-50 pt-4 text-xs text-gray-400">
      <li v-for="[label, text] in guide.notes" :key="label">
        <span class="font-medium text-gray-300">{{ label }}</span> — {{ text }}
      </li>
      <li>Everything stays in your browser; nothing is uploaded.</li>
    </ul>
    <div class="flex items-center justify-between gap-3">
      <div class="flex gap-4 text-xs">
        <button class="text-gray-400 hover:text-white" @click="ui.startTour()">
          Take the tour
        </button>
        <button class="text-gray-400 hover:text-white" @click="loadDemo">Try the demo</button>
      </div>
      <button class="btn-accent" @click="ui.close()">Got it</button>
    </div>
  </BaseModal>
</template>
