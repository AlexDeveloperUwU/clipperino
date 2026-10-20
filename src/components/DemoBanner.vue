<script setup>
import { FlaskConical } from "@lucide/vue";
import { useProjectStore } from "../stores/project.js";
import { useUiStore } from "../stores/ui.js";
import { exitDemo, startTour } from "../services/demo.js";

const project = useProjectStore();
const ui = useUiStore();
</script>

<template>
  <Transition name="banner">
    <div
      v-if="project.demoActive"
      class="flex flex-none items-center justify-center gap-3 border-b border-accent-100/30 bg-accent-100/10 px-4 py-1.5 text-xs text-gray-300"
      role="status"
    >
      <FlaskConical class="h-4 w-4 text-accent-100" aria-hidden="true" />
      <span>Demo project — changes are not saved.</span>
      <button
        v-if="ui.tourStep < 0"
        class="font-bold text-accent-100 hover:underline"
        @click="startTour"
      >
        Take the tour
      </button>
      <button class="font-bold text-accent-100 hover:underline" @click="exitDemo">Exit demo</button>
    </div>
  </Transition>
</template>
