<script setup>
import { Info } from "@lucide/vue";
import { useUiStore } from "../stores/ui.js";

const ui = useUiStore();
</script>

<template>
  <TransitionGroup
    name="toast"
    tag="div"
    class="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2"
  >
    <div
      v-for="toast in ui.toasts"
      :key="toast.id"
      class="flex items-center rounded-lg border border-dark-50 bg-dark-50 px-4 py-3 text-white shadow-lg"
    >
      <Info class="mr-2 h-5 w-5 text-accent-100" />
      <span>{{ toast.message }}</span>
    </div>
  </TransitionGroup>
</template>
