<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import VideoPlayer from "./VideoPlayer.vue";
import TransportBar from "./TransportBar.vue";
import TimelinePanel from "./TimelinePanel.vue";
import { useMediaStore } from "../../stores/media.js";
import { useUiStore } from "../../stores/ui.js";

const FOCUS_TAGS = ["input", "select", "textarea", "button"];

const SEEK_STEP_SECONDS = 5;

const media = useMediaStore();
const ui = useUiStore();

const SHORTCUTS = {
  Space: () => media.togglePlay(),
  ArrowLeft: () => media.seek(Math.max(0, media.currentTime - SEEK_STEP_SECONDS)),
  ArrowRight: () => media.seek(media.currentTime + SEEK_STEP_SECONDS),
};

/** Space plays or pauses and the arrow keys seek, while the Preview tab is active and no control has focus. */
function onKeyDown(event) {
  if (ui.activeTab !== "preview" || !(event.code in SHORTCUTS)) return;
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
  if (FOCUS_TAGS.includes(document.activeElement.tagName.toLowerCase())) return;
  event.preventDefault();
  SHORTCUTS[event.code]();
}

onMounted(() => document.addEventListener("keydown", onKeyDown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeyDown));
</script>

<template>
  <div class="flex h-full flex-col p-4">
    <div
      class="flex h-full flex-col overflow-hidden rounded-lg border border-dark-50 bg-dark-200 shadow-lg"
    >
      <VideoPlayer />
      <TransportBar />
      <TimelinePanel />
    </div>
  </div>
</template>
