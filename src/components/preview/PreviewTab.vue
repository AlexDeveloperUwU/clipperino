<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import VideoPlayer from "./VideoPlayer.vue";
import TransportBar from "./TransportBar.vue";
import TimelinePanel from "./TimelinePanel.vue";
import { useMediaStore } from "../../stores/media.js";
import { useUiStore } from "../../stores/ui.js";

const FIELD_TAGS = ["input", "select", "textarea"];

const SEEK_STEP_SECONDS = 5;

const media = useMediaStore();
const ui = useUiStore();

let keySeeked = false;

const seekBy = (seconds) => {
  if (media.seek(Math.max(0, media.currentTime + seconds))) keySeeked = true;
};

/** Reports a keyboard seek once the arrow key is released, so a held key finishes first. */
function onKeyUp(event) {
  if (!keySeeked || !event.code.startsWith("Arrow")) return;
  keySeeked = false;
  ui.signal("keySeek");
}

const SHORTCUTS = {
  Space: () => media.togglePlay(),
  ArrowLeft: () => seekBy(-SEEK_STEP_SECONDS),
  ArrowRight: () => seekBy(SEEK_STEP_SECONDS),
};

/** Space plays or pauses and the arrows seek, on the Preview tab; fields keep their keys, and a focused button keeps Space. */
function onKeyDown(event) {
  if (ui.activeTab !== "preview" || !(event.code in SHORTCUTS)) return;
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
  const tag = document.activeElement.tagName.toLowerCase();
  if (FIELD_TAGS.includes(tag) || (tag === "button" && event.code === "Space")) return;
  event.preventDefault();
  SHORTCUTS[event.code]();
}

onMounted(() => {
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeyDown);
  document.removeEventListener("keyup", onKeyUp);
});
</script>

<template>
  <div class="flex h-full flex-col p-4">
    <div
      class="flex h-full flex-col overflow-hidden rounded-lg border border-dark-50 bg-dark-200 shadow-lg"
    >
      <VideoPlayer />
      <div class="flex flex-none flex-col">
        <TransportBar />
        <TimelinePanel />
      </div>
    </div>
  </div>
</template>
