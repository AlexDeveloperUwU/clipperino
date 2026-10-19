<script setup>
import BaseModal from "../BaseModal.vue";
import BrandMark from "../BrandMark.vue";
import { useUiStore } from "../../stores/ui.js";
import { loadDemo } from "../../services/demo.js";

const ui = useUiStore();

/** Closes the prompt, then runs the chosen onboarding action. */
function choose(action) {
  ui.close();
  action();
}
</script>

<template>
  <BaseModal name="welcome">
    <h2 class="mb-2 flex items-center gap-2 text-lg font-bold text-white">
      <BrandMark class="h-6 w-6" /> Welcome to Clipperino
    </h2>
    <p class="mb-6 text-sm text-gray-400">
      Turn a timestamped transcript into clips, preview them against your video and export them. It
      runs entirely in your browser — nothing is uploaded.
    </p>
    <div class="flex flex-col gap-3">
      <button class="btn-accent" @click="choose(() => ui.startTour())">Take a 1-minute tour</button>
      <button
        class="rounded bg-dark-100 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-dark-50 hover:text-white"
        @click="choose(loadDemo)"
      >
        Try the demo project
      </button>
      <button class="text-xs text-gray-500 hover:text-gray-300" @click="ui.close()">
        Skip, I'll explore on my own
      </button>
    </div>
  </BaseModal>
</template>
