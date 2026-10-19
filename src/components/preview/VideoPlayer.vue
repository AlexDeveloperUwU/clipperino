<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Film } from "@lucide/vue";
import { useMediaStore } from "../../stores/media.js";

const media = useMediaStore();
const video = ref(null);

onMounted(() => (media.element = video.value));
onBeforeUnmount(() => (media.element = null));
</script>

<template>
  <div class="relative flex flex-1 items-center justify-center overflow-hidden bg-dark-400">
    <video
      ref="video"
      :src="media.mediaUrl ?? undefined"
      class="h-full w-full object-contain focus:outline-none"
      @timeupdate="media.currentTime = $event.target.currentTime"
      @loadedmetadata="media.onMetadata()"
      @play="media.paused = false"
      @pause="media.paused = true"
      @ended="media.paused = true"
    ></video>

    <div
      v-if="!media.hasMedia"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6 bg-dark-300 text-gray-500"
    >
      <div class="relative">
        <div class="absolute -inset-4 animate-pulse rounded-full bg-accent-100/10 blur-xl"></div>
        <div class="relative z-10 rounded-2xl border border-dark-50 bg-dark-100 p-8 shadow-2xl">
          <Film class="h-16 w-16 text-gray-600" />
        </div>
      </div>
      <div class="text-center">
        <template v-if="media.needsReload">
          <h3 class="mb-1 text-lg font-bold text-gray-300">Video Reload Required</h3>
          <p class="text-sm text-gray-500">
            Please re-load
            <strong class="text-white">{{ media.meta.name }}</strong> to continue previewing.
          </p>
        </template>
        <template v-else>
          <h3 class="mb-1 text-lg font-bold text-gray-300">No Video Loaded</h3>
          <p class="text-sm text-gray-500">Import a video file to preview your clips</p>
        </template>
      </div>
    </div>

    <div
      v-if="media.showSubtitles"
      :class="media.currentSubtitle ? 'opacity-100' : 'opacity-0'"
      class="pointer-events-none absolute bottom-4 left-0 right-0 z-30 px-8 text-center transition-opacity duration-200"
    >
      <span
        class="subtitle-text rounded-lg bg-black/70 px-4 py-2 text-lg text-white shadow-lg backdrop-blur-sm"
        >{{ media.currentSubtitle }}</span
      >
    </div>
  </div>
</template>
