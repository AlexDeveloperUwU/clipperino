<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useUiStore } from "../stores/ui.js";
import { TOUR_STEPS } from "../lib/tourSteps.js";
import { placePopover } from "../lib/popover.js";

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 190;

const ui = useUiStore();
const rect = ref(null);
const popover = ref(null);
const primary = ref(null);
const viewport = ref({ width: window.innerWidth, height: window.innerHeight });
const step = computed(() => TOUR_STEPS[ui.tourStep]);
const isLast = computed(() => ui.tourStep === TOUR_STEPS.length - 1);
let targetObserver = null;
let opener = null;

function findTarget() {
  return step.value && document.querySelector(`[data-tour="${step.value.target}"]`);
}

/** Reads the highlighted element's box; null when it is missing or hidden. */
function measure() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight };
  const box = findTarget()?.getBoundingClientRect();
  rect.value = box && box.width > 0 ? box : null;
}

const popoverStyle = computed(() =>
  placePopover(rect.value, viewport.value, { width: POPOVER_WIDTH, height: POPOVER_HEIGHT }),
);

function end() {
  ui.tourStep = -1;
}

function onKeyDown(event) {
  if (ui.tourStep < 0) return;
  if (event.key === "Escape") {
    end();
    return;
  }
  if (event.key !== "Tab" || !popover.value) return;
  const items = [...popover.value.querySelectorAll("button")];
  const first = items[0];
  const last = items[items.length - 1];
  if (!popover.value.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function observeTarget() {
  targetObserver?.disconnect();
  targetObserver = null;
  const el = findTarget();
  if (!el) return;
  targetObserver = new ResizeObserver(measure);
  targetObserver.observe(el);
}

watch(
  () => ui.tourStep,
  async (current, previous) => {
    if (current < 0) {
      targetObserver?.disconnect();
      targetObserver = null;
      opener?.focus?.();
      opener = null;
      return;
    }
    if (previous < 0) opener = document.activeElement;
    await nextTick();
    measure();
    observeTarget();
    primary.value?.focus();
    requestAnimationFrame(() => {
      if (ui.tourStep !== current) return;
      measure();
      observeTarget();
    });
  },
);

onMounted(() => {
  window.addEventListener("resize", measure);
  window.addEventListener("scroll", measure, true);
  document.addEventListener("keydown", onKeyDown);
});
onBeforeUnmount(() => {
  targetObserver?.disconnect();
  window.removeEventListener("resize", measure);
  window.removeEventListener("scroll", measure, true);
  document.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <div v-if="step" class="fixed inset-0 z-[60]" role="dialog" aria-label="Guided tour">
    <div v-if="!rect" class="absolute inset-0 bg-black/70"></div>
    <div
      v-else
      class="pointer-events-none absolute rounded-lg outline outline-2 outline-accent-100 transition-all duration-200"
      :style="{
        top: `${rect.top - 4}px`,
        left: `${rect.left - 4}px`,
        width: `${rect.width + 8}px`,
        height: `${rect.height + 8}px`,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
      }"
    ></div>

    <div
      ref="popover"
      :style="popoverStyle"
      class="absolute rounded-lg border border-dark-50 bg-dark-200 p-4 shadow-2xl"
    >
      <p class="mb-1 text-xs font-bold uppercase tracking-wider text-accent-100">
        Step {{ ui.tourStep + 1 }} of {{ TOUR_STEPS.length }}
      </p>
      <h3 class="mb-1 text-base font-bold text-white">{{ step.title }}</h3>
      <p class="mb-4 text-sm text-gray-400">{{ step.text }}</p>
      <div class="flex items-center justify-between">
        <button class="text-xs text-gray-500 hover:text-gray-300" @click="end">Skip tour</button>
        <div class="flex gap-2">
          <button v-if="ui.tourStep > 0" class="btn-cancel" @click="ui.tourStep--">Back</button>
          <button ref="primary" class="btn-accent" @click="isLast ? end() : ui.tourStep++">
            {{ isLast ? "Done" : "Next" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
