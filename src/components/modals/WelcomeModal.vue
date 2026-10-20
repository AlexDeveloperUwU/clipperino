<script setup>
import BaseModal from "../BaseModal.vue";
import BrandMark from "../BrandMark.vue";
import { useUiStore } from "../../stores/ui.js";
import { startTour } from "../../services/demo.js";

const ui = useUiStore();
</script>

<template>
  <BaseModal name="welcome">
    <h2 class="modal-title mb-2"><BrandMark class="h-6 w-6" /> Welcome to Clipperino</h2>
    <p class="mb-6 text-sm text-gray-400">
      Turn a timestamped transcript into clips, preview them against your video and export them. It
      runs entirely in your browser — nothing is uploaded.
    </p>
    <div class="flex flex-col gap-3">
      <button class="btn-accent" @click="startTour">Take the interactive tour</button>
      <button class="text-xs text-gray-500 hover:text-gray-300" @click="ui.close()">
        Skip, I'll explore on my own
      </button>
    </div>
  </BaseModal>
</template>
