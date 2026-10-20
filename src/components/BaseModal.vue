<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useUiStore } from "../stores/ui.js";

const FOCUSABLE = "button:not([disabled]), [href], input:not([disabled]), select, textarea";

const props = defineProps({
  name: { type: String, required: true },
  widthClass: { type: String, default: "max-w-md" },
  dismissible: { type: Boolean, default: true },
});
const emit = defineEmits(["opened"]);

const ui = useUiStore();
const isOpen = computed(() => ui.openModal === props.name);
const card = ref(null);
let opener = null;

/** Closes on a click outside the dialog card, when dismissible. */
function onBackdrop(e) {
  if (props.dismissible && e.target === e.currentTarget) ui.close();
}

/** Esc closes a dismissible modal; Tab wraps inside the card. */
function onKeydown(e) {
  if (e.key === "Escape" && props.dismissible) {
    ui.close();
    return;
  }
  if (e.key !== "Tab") return;
  if (!card.value) return;
  const items = [...card.value.querySelectorAll(FOCUSABLE)];
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (!card.value.contains(document.activeElement)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  } else if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

watch(isOpen, async (open) => {
  if (!open) {
    document.removeEventListener("keydown", onKeydown);
    opener?.focus?.();
    opener = null;
    return;
  }
  document.addEventListener("keydown", onKeydown);
  opener = document.activeElement;
  await nextTick();
  if (!card.value) return;
  const heading = card.value.querySelector("h2");
  if (heading) {
    heading.id ||= `${props.name}-title`;
    card.value.setAttribute("aria-labelledby", heading.id);
  }
  if (!card.value.contains(document.activeElement)) card.value.querySelector(FOCUSABLE)?.focus();
  emit("opened");
});

onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      @mousedown="onBackdrop"
    >
      <div
        ref="card"
        role="dialog"
        aria-modal="true"
        :class="widthClass"
        class="modal-card w-full rounded-lg border border-dark-50 bg-dark-200 p-6 shadow-2xl"
      >
        <slot />
      </div>
    </div>
  </Transition>
</template>
