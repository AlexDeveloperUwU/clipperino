<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Activity, Magnet, Minus, Plus } from "@lucide/vue";
import { useMediaStore } from "../../stores/media.js";
import { useProjectStore } from "../../stores/project.js";
import { formatTime } from "../../lib/timecode.js";
import { buildClipBlocks, buildRulerMarks } from "../../lib/timeline.js";
import { useTimelineScrub } from "../../composables/useTimelineScrub.js";
import { useTimelineZoom } from "../../composables/useTimelineZoom.js";

const media = useMediaStore();
const project = useProjectStore();

const scroller = ref(null);
const wrapper = ref(null);
const scrollerWidth = ref(0);
const { zoom, maxZoom, zoomBy, onZoomInput } = useTimelineZoom(scroller);
let observer = null;

const span = computed(() => media.timelineSpan);
const hasSpan = computed(() => span.value > 0);
const rulerMarks = computed(() => buildRulerMarks(span.value, scrollerWidth.value * zoom.value));

const clipBlocks = computed(() => buildClipBlocks(project.clips, span.value));

const {
  scrubbing,
  scrubTime,
  snapTime,
  start: onScrubStart,
} = useTimelineScrub(wrapper, () => clipBlocks.value);

const playheadPercent = computed(() => {
  if (!hasSpan.value) return 0;
  return ((scrubbing.value ? scrubTime.value : media.currentTime) / span.value) * 100;
});

/** Seeks to the start of a clip block. */
function jumpToClip(clip) {
  media.jumpTo(clip.start, `Jumped to clip: ${clip.name}`);
}

onMounted(() => {
  observer = new ResizeObserver(([entry]) => (scrollerWidth.value = entry.contentRect.width));
  observer.observe(scroller.value);
});

onBeforeUnmount(() => observer?.disconnect());

const zoomBtn = "p-1 hover:bg-dark-50 rounded text-gray-400 hover:text-white transition-colors";
</script>

<template>
  <div class="relative flex h-64 select-none flex-col border-t border-dark-50 bg-dark-100">
    <div
      class="z-10 flex flex-none items-center justify-between border-b border-dark-50/50 bg-dark-200 px-4 py-2"
    >
      <div class="flex items-center gap-4">
        <h3
          class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400"
        >
          <Activity class="h-3 w-3" /> Timeline
        </h3>
        <div class="h-3 w-px bg-dark-50"></div>
        <div class="flex items-center gap-2">
          <button :class="zoomBtn" title="Zoom Out" @click="zoomBy(-1)">
            <Minus class="h-3 w-3" />
          </button>
          <div class="relative flex items-center">
            <input
              type="number"
              min="10"
              :max="Math.round(maxZoom * 100)"
              :value="Math.round(zoom * 100)"
              class="w-14 rounded border border-dark-50 bg-dark-50 py-0.5 text-center font-mono text-xs text-white focus:border-accent-100 focus:outline-none"
              @change="onZoomInput"
            />
            <span class="pointer-events-none absolute right-3 text-xs text-gray-500">%</span>
          </div>
          <button :class="zoomBtn" title="Zoom In" @click="zoomBy(1)">
            <Plus class="h-3 w-3" />
          </button>
        </div>
        <span
          :class="snapTime !== null ? 'opacity-100' : 'opacity-0'"
          class="text-[10px] font-bold uppercase tracking-wider text-yellow-500 transition-opacity"
        >
          <Magnet class="mr-1 inline-block h-3 w-3" />Snapped
        </span>
      </div>
      <span class="font-mono text-xs text-gray-500">{{ formatTime(span) }}</span>
    </div>

    <div ref="scroller" class="relative flex-1 overflow-x-auto bg-dark-300/80">
      <div
        ref="wrapper"
        :style="{ width: hasSpan ? `${zoom * 100}%` : '100%' }"
        class="relative h-full touch-none transition-[width] duration-200 ease-out"
        @pointerdown="onScrubStart"
      >
        <div
          class="pointer-events-none relative h-6 w-full select-none border-b border-dark-50/30 bg-dark-200/50 font-mono text-[10px] text-gray-500"
        >
          <div
            v-for="mark in rulerMarks"
            :key="mark.left"
            :style="{ left: `${mark.left}%` }"
            class="absolute bottom-0 top-0 border-l border-gray-600/50 pl-1 pt-1"
          >
            <span>{{ mark.label }}</span>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 right-0 top-6">
          <p
            v-if="!hasSpan"
            class="absolute inset-0 flex select-none items-center justify-center text-xs text-gray-500"
          >
            Import a transcript or load a video to see the timeline
          </p>
          <template v-else>
            <div
              v-for="(clip, i) in clipBlocks"
              :key="i"
              :style="{ left: `${clip.left}%`, width: `${clip.width}%` }"
              class="absolute bottom-2 top-2 cursor-pointer overflow-hidden rounded-sm border border-accent-100/50 bg-accent-100/20 shadow-sm transition-colors hover:border-accent-100 hover:bg-accent-100/40"
              @pointerdown.stop="jumpToClip(clip)"
            >
              <div
                class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)] opacity-10"
              ></div>
              <div
                class="pointer-events-none absolute left-1 top-1 max-w-full select-none truncate px-1 text-[10px] font-bold text-gray-200 drop-shadow-md"
              >
                {{ clip.name }}
              </div>
            </div>
          </template>
        </div>

        <div
          v-if="snapTime !== null"
          :style="{ left: `${(snapTime / span) * 100}%` }"
          class="pointer-events-none absolute bottom-0 top-0 z-30 h-full w-px -translate-x-1/2 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
        ></div>

        <div
          :style="{ left: `${playheadPercent}%` }"
          class="absolute bottom-0 top-0 z-40 flex h-full w-4 -translate-x-1/2 cursor-col-resize flex-col items-center"
        >
          <div
            class="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-md"
          ></div>
          <div class="h-full w-px bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
        </div>
      </div>
    </div>
  </div>
</template>
