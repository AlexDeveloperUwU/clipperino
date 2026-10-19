<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Keyboard } from "@lucide/vue";
import { useUiStore } from "../stores/ui.js";

const ui = useUiStore();
const visible = ref(false);

const onKeyDown = (e) => {
  if (e.key === "Shift" && ui.activeTab === "editor") visible.value = true;
};
const onKeyUp = (e) => {
  if (e.key === "Shift") visible.value = false;
};
const onHide = () => {
  if (document.visibilityState === "hidden") visible.value = false;
};

onMounted(() => {
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("visibilitychange", onHide);
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeyDown);
  document.removeEventListener("keyup", onKeyUp);
  document.removeEventListener("visibilitychange", onHide);
});
</script>

<template>
  <div
    :class="visible ? 'bottom-10' : '-bottom-12'"
    class="pointer-events-none fixed left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-dark-100/95 px-4 py-2 text-xs text-white shadow-lg transition-all duration-300"
  >
    <Keyboard class="h-4 w-4 text-accent-100" />
    <span>
      Hold
      <kbd class="rounded border border-gray-600 bg-dark-100 px-1 font-mono text-white">Shift</kbd>
      for multi-select
    </span>
  </div>
</template>
