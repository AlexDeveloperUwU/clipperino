<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useUiStore } from "../stores/ui.js";
import { useProjectStore } from "../stores/project.js";
import { useMediaStore } from "../stores/media.js";
import { TOUR_STEPS } from "../lib/tourSteps.js";
import { placePopover } from "../lib/popover.js";
import { useTourProgress } from "../composables/useTourProgress.js";

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 220;
const BROKEN_GRACE_MS = 80;
const SETTLE_FRAMES = 45;
const STABLE_FRAMES = 3;
const DIM = "0 0 0 9999px rgba(0, 0, 0, 0.7)";

const ui = useUiStore();
const project = useProjectStore();
const media = useMediaStore();
const { enter, isDone, isBroken } = useTourProgress();
const rect = ref(null);
const popover = ref(null);
const primary = ref(null);
const popoverHeight = ref(POPOVER_HEIGHT);
const viewport = ref({ width: window.innerWidth, height: window.innerHeight });
const step = computed(() => TOUR_STEPS[ui.tourStep]);
const isLast = computed(() => ui.tourStep === TOUR_STEPS.length - 1);
const done = computed(() => !!step.value && isDone(step.value));
const visible = computed(() => !ui.openModal || ui.openModal === step.value?.target);
let targetObserver = null;
let popoverObserver = null;
let settleFrame = 0;
let opener = null;

function findTarget() {
  return step.value?.target && document.querySelector(`[data-tour="${step.value.target}"]`);
}

/** Reads the target's box; a target that is momentarily gone keeps the last highlight, a hidden one (other tab) or none clears it. */
function measure() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight };
  const el = findTarget();
  const box = el?.closest("[inert]") ? { width: 0 } : el?.getBoundingClientRect();
  if (box?.width > 0) rect.value = box;
  else if (box || !step.value?.target) rect.value = null;
}

const spotlightStyle = computed(() => {
  const box = rect.value;
  const { width, height } = viewport.value;
  const ring = `0 0 0 2px rgba(96, 165, 250, ${box ? 1 : 0})`;
  return {
    top: `${box ? box.top - 4 : height / 2}px`,
    left: `${box ? box.left - 4 : width / 2}px`,
    width: `${box ? box.width + 8 : 0}px`,
    height: `${box ? box.height + 8 : 0}px`,
    boxShadow: `${ring}, ${DIM}`,
  };
});

const popoverStyle = computed(() =>
  placePopover(rect.value, viewport.value, {
    width: POPOVER_WIDTH,
    height: popoverHeight.value,
  }),
);

function end() {
  ui.tourStep = -1;
}

function onKeyDown(event) {
  if (ui.tourStep >= 0 && event.key === "Escape" && !ui.openModal) end();
}

function observeTarget() {
  targetObserver?.disconnect();
  targetObserver = null;
  const el = findTarget();
  if (!el) return;
  targetObserver = new ResizeObserver(() => measure());
  targetObserver.observe(el);
}

/** Follows the target frame by frame until it stops moving (tab switch, modal fade, scroll), so the highlight never jumps. */
function settle() {
  cancelAnimationFrame(settleFrame);
  const current = ui.tourStep;
  let frames = 0;
  let stable = 0;
  let last = "";
  let scrolled = false;
  const tick = () => {
    if (ui.tourStep !== current) return;
    const el = findTarget();
    if (el && !scrolled) {
      scrolled = true;
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
    measure();
    const key = rect.value
      ? [rect.value.top, rect.value.left, rect.value.width, rect.value.height].join()
      : "";
    stable = key && key === last ? stable + 1 : 0;
    last = key;
    if (stable >= STABLE_FRAMES) {
      observeTarget();
      return;
    }
    if (++frames >= SETTLE_FRAMES) {
      measure();
      observeTarget();
      return;
    }
    settleFrame = requestAnimationFrame(tick);
  };
  settleFrame = requestAnimationFrame(tick);
}

function focusPrimary() {
  primary.value?.focus();
}

watch(
  () => ui.tourStep,
  (current, previous) => {
    if (current < 0) {
      cancelAnimationFrame(settleFrame);
      targetObserver?.disconnect();
      targetObserver = null;
      opener?.focus?.();
      opener = null;
      return;
    }
    if (previous < 0) opener = document.activeElement;
    enter(TOUR_STEPS[current]);
    settle();
  },
);

watch(done, (isComplete) => {
  if (isComplete) ui.tourStep++;
});

watch(
  [() => isBroken(step.value), () => ui.tourStep],
  ([broken]) => {
    if (!broken) return;
    const current = ui.tourStep;
    setTimeout(() => {
      if (ui.tourStep === current && isBroken(step.value) && !done.value) ui.tourStep--;
    }, BROKEN_GRACE_MS);
  },
  { flush: "post" },
);

watch(
  () => ui.activeTab,
  () => measure(),
  { flush: "post" },
);

watch(popover, (el) => {
  popoverObserver?.disconnect();
  popoverObserver = null;
  if (!el) return;
  popoverObserver = new ResizeObserver(([entry]) => {
    popoverHeight.value = entry.target.offsetHeight || popoverHeight.value;
  });
  popoverObserver.observe(el);
});

watch(
  () => project.demoActive,
  (active) => {
    if (!active && ui.tourStep >= 0) end();
  },
);

onMounted(() => {
  window.addEventListener("resize", measure);
  window.addEventListener("scroll", measure, true);
  document.addEventListener("keydown", onKeyDown);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(settleFrame);
  targetObserver?.disconnect();
  popoverObserver?.disconnect();
  window.removeEventListener("resize", measure);
  window.removeEventListener("scroll", measure, true);
  document.removeEventListener("keydown", onKeyDown);
});
</script>

<template>
  <Transition name="tour-dim">
    <div v-if="step" v-show="visible" class="pointer-events-none fixed inset-0 z-[60]">
      <div
        class="absolute rounded-lg transition-[top,left,width,height,box-shadow] duration-300 ease-out"
        :style="spotlightStyle"
      ></div>

      <div
        ref="popover"
        :style="popoverStyle"
        role="dialog"
        aria-label="Guided tour"
        aria-live="polite"
        class="pointer-events-auto absolute flex min-h-[220px] flex-col rounded-lg border border-dark-50 bg-dark-200 p-4 shadow-2xl transition-[top,left] duration-300 ease-out"
      >
        <div class="grid flex-1">
          <Transition name="tour-fade" @after-enter="focusPrimary">
            <div :key="ui.tourStep" class="col-start-1 row-start-1 flex flex-col">
              <p class="mb-1 text-xs font-bold uppercase tracking-wider text-accent-100">
                Step {{ ui.tourStep + 1 }} of {{ TOUR_STEPS.length }}
              </p>
              <h3 class="mb-1 text-base font-bold text-white">{{ step.title }}</h3>
              <p class="mb-3 text-sm text-gray-400">{{ step.text }}</p>
              <p v-if="step.until" class="mb-3 text-xs font-medium text-accent-100">
                {{
                  step.needsVideo && !media.hasMedia
                    ? "The demo video isn't loaded, so use Skip step."
                    : "Try it — the tour continues when you do."
                }}
              </p>
              <div class="mt-auto flex items-center justify-between">
                <button class="text-xs text-gray-500 hover:text-gray-300" @click="end">
                  Skip tour
                </button>
                <div class="flex gap-2">
                  <button v-if="ui.tourStep > 0" class="btn-cancel" @click="ui.tourStep--">
                    Back
                  </button>
                  <button
                    v-if="step.until"
                    class="btn-cancel"
                    title="Move on without doing it"
                    @click="ui.tourStep++"
                  >
                    Skip step
                  </button>
                  <button
                    v-else
                    ref="primary"
                    class="btn-accent"
                    @click="isLast ? end() : ui.tourStep++"
                  >
                    {{ isLast ? "Done" : "Next" }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>
</template>
