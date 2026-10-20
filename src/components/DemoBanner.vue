<script setup>
import { FlaskConical } from "@lucide/vue";
import { useProjectStore } from "../stores/project.js";
import { exitDemo } from "../services/demo.js";

const project = useProjectStore();
</script>

<template>
  <div
    v-if="project.demoActive"
    class="flex flex-none items-center justify-center gap-3 border-b border-accent-100/30 bg-accent-100/10 px-4 py-1.5 text-xs text-gray-300"
    role="status"
  >
    <FlaskConical class="h-4 w-4 text-accent-100" aria-hidden="true" />
    <span>Demo project — changes are not saved.</span>
    <button class="font-bold text-accent-100 hover:underline" @click="exitDemo">Exit demo</button>
  </div>
</template>
