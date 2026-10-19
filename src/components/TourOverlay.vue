<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useUiStore } from "../stores/ui.js";

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 190;
const GAP = 12;

const STEPS = [
  {
    target: "import",
    title: "Start with a transcript",
    text: "Import a CSV with start, end and text columns. No file handy? Load the demo from the Help window.",
  },
  {
    target: "table",
    title: "Pick the lines you want",
    text: "Click Select on a line. Hold Shift and click another one to select a whole range.",
  },
  {
    target: "selection",
    title: "Build a clip",
    text: "Your selection appears here. Add Clip saves it under a name of your choice.",
  },
  {
    target: "clips",
    title: "Manage and export",
    text: "Edit, rename or delete clips, and export them as JSON or as an EDL for your video editor.",
  },
  {
    target: "tab-preview",
    title: "Preview against the video",
    text: "Load the matching video, scrub the timeline and jump between clips.",
  },
  {
    target: "project",
    title: "Save your work",
    text: "Save Project writes a .clpproj file you can reopen later. Your session is also autosaved in this browser.",
  },
];

const ui = useUiStore();
const rect = ref(null);
const step = computed(() => STEPS[ui.tourStep]);
const isLast = computed(() => ui.tourStep === STEPS.length - 1);

/** Reads the highlighted element's box; null when it is missing or hidden. */
function measure() {
  const el = step.value && document.querySelector(`[data-tour="${step.value.target}"]`);
  const box = el?.getBoundingClientRect();
  rect.value = box && box.width > 0 ? box : null;
}

const popoverStyle = computed(() => {
  const base = { width: `${POPOVER_WIDTH}px` };
  const box = rect.value;
  if (!box) return { ...base, top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  const left = `${Math.min(Math.max(GAP, box.left), window.innerWidth - POPOVER_WIDTH - GAP)}px`;
  if (box.bottom + GAP + POPOVER_HEIGHT < window.innerHeight) {
    return { ...base, left, top: `${box.bottom + GAP}px` };
  }
  if (box.top > POPOVER_HEIGHT + GAP) {
    return { ...base, left, bottom: `${window.innerHeight - box.top + GAP}px` };
  }
  return { ...base, left: `${box.left + GAP}px`, top: `${box.top + GAP}px` };
});

function end() {
  ui.tourStep = -1;
}

function onKeyDown(event) {
  if (ui.tourStep >= 0 && event.key === "Escape") end();
}

watch(
  () => ui.tourStep,
  async () => {
    await nextTick();
    measure();
  },
);

onMounted(() => {
  window.addEventListener("resize", measure);
  document.addEventListener("keydown", onKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", measure);
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
      :style="popoverStyle"
      class="absolute rounded-lg border border-dark-50 bg-dark-200 p-4 shadow-2xl"
    >
      <p class="mb-1 text-xs font-bold uppercase tracking-wider text-accent-100">
        Step {{ ui.tourStep + 1 }} of {{ STEPS.length }}
      </p>
      <h3 class="mb-1 text-base font-bold text-white">{{ step.title }}</h3>
      <p class="mb-4 text-sm text-gray-400">{{ step.text }}</p>
      <div class="flex items-center justify-between">
        <button class="text-xs text-gray-500 hover:text-gray-300" @click="end">Skip tour</button>
        <div class="flex gap-2">
          <button v-if="ui.tourStep > 0" class="btn-cancel" @click="ui.tourStep--">Back</button>
          <button class="btn-accent" @click="isLast ? end() : ui.tourStep++">
            {{ isLast ? "Done" : "Next" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
