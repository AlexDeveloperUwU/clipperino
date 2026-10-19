<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import { Film } from "lucide-vue-next";
import VideoPlayer from "./VideoPlayer.vue";
import TransportBar from "./TransportBar.vue";
import TimelinePanel from "./TimelinePanel.vue";
import DropOverlay from "../DropOverlay.vue";
import { useMediaStore } from "../../stores/media.js";
import { useUiStore } from "../../stores/ui.js";
import { dropVideo } from "../../services/videoPicker.js";
import { useFileDrop } from "../../composables/useFileDrop.js";

const FOCUS_TAGS = ["input", "select", "textarea", "button"];

const media = useMediaStore();
const ui = useUiStore();
const { dragging, handlers } = useFileDrop(dropVideo);

/** Space toggles playback while the Preview tab is active, unless a control has focus. */
function onKeyDown(event) {
  if (event.code !== "Space" || ui.activeTab !== "preview") return;
  if (FOCUS_TAGS.includes(document.activeElement.tagName.toLowerCase())) return;
  event.preventDefault();
  media.togglePlay();
}

onMounted(() => document.addEventListener("keydown", onKeyDown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeyDown));
</script>

<template>
  <div class="relative flex h-full flex-col p-4" v-bind="handlers">
    <div
      class="flex h-full flex-col overflow-hidden rounded-lg border border-dark-50 bg-dark-200 shadow-lg"
    >
      <VideoPlayer />
      <TransportBar />
      <TimelinePanel />
    </div>

    <DropOverlay
      :visible="dragging"
      title="Drop Video File Here"
      subtitle="Load the video to preview your clips"
    >
      <Film class="h-20 w-20 animate-bounce text-accent-100" />
    </DropOverlay>
  </div>
</template>
