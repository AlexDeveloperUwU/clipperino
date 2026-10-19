<script setup>
import { computed } from "vue";
import { useUiStore } from "../stores/ui.js";

const props = defineProps({
  name: { type: String, required: true },
  widthClass: { type: String, default: "max-w-md" },
  dismissible: { type: Boolean, default: true },
});

const ui = useUiStore();
const isOpen = computed(() => ui.openModal === props.name);

/** Closes on a click outside the dialog card, when dismissible. */
function onBackdrop(e) {
  if (props.dismissible && e.target === e.currentTarget) ui.close();
}
</script>

<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      @mousedown="onBackdrop"
    >
      <div
        :class="widthClass"
        class="modal-card w-full rounded-lg border border-dark-50 bg-dark-200 p-6 shadow-2xl"
      >
        <slot />
      </div>
    </div>
  </Transition>
</template>
