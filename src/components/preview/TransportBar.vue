<script setup>
import {
  ChevronDown,
  MessageSquare,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Speaker,
  Volume2,
  VolumeX,
} from "@lucide/vue";
import { useMediaStore } from "../../stores/media.js";
import { useAudioOutputs } from "../../composables/useAudioOutputs.js";

const media = useMediaStore();
const { supported, outputs, unlockLabels, onOutputChange } = useAudioOutputs();

const iconBtn = "p-2 hover:bg-dark-100 rounded text-gray-400 hover:text-white transition-colors";
</script>

<template>
  <div
    class="z-20 flex h-12 shrink-0 items-center justify-between border-t border-dark-50 bg-dark-200 px-4"
  >
    <div class="flex items-center gap-2">
      <button :class="iconBtn" title="Previous Clip" @click="media.skipToPrevClip()">
        <SkipBack class="h-4 w-4" />
      </button>
      <button
        class="rounded-full bg-accent-100 p-2 text-white shadow-lg shadow-accent-100/20 transition-colors hover:bg-accent-200"
        title="Play/Pause"
        @click="media.togglePlay()"
      >
        <Play v-if="media.paused" class="h-4 w-4 fill-current" />
        <Pause v-else class="h-4 w-4 fill-current" />
      </button>
      <button :class="iconBtn" title="Next Clip" @click="media.skipToNextClip()">
        <SkipForward class="h-4 w-4" />
      </button>
    </div>

    <div class="flex items-center gap-3">
      <button
        :class="media.showSubtitles ? 'bg-accent-100/10 text-accent-100' : 'text-gray-400'"
        class="flex items-center gap-2 rounded p-2 transition-colors hover:bg-dark-100 hover:text-white"
        title="Toggle Subtitles"
        @click="media.showSubtitles = !media.showSubtitles"
      >
        <MessageSquare class="h-4 w-4" />
        <span class="text-xs font-medium">CC</span>
      </button>
      <div class="h-4 w-px bg-dark-50"></div>
      <div class="flex items-center gap-1">
        <button
          :class="iconBtn"
          :title="media.muted ? 'Unmute' : 'Mute'"
          :aria-label="media.muted ? 'Unmute' : 'Mute'"
          @click="media.toggleMute()"
        >
          <VolumeX v-if="media.muted || media.volume === 0" class="h-4 w-4" />
          <Volume2 v-else class="h-4 w-4" />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="media.muted ? 0 : media.volume"
          aria-label="Volume"
          class="h-1 w-20 cursor-pointer accent-accent-100"
          @input="media.setVolume(Number($event.target.value))"
        />
      </div>
      <div class="h-4 w-px bg-dark-50"></div>
      <div class="relative">
        <Speaker
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
        />
        <select
          :disabled="!supported"
          aria-label="Audio output device"
          title="Choose where audio plays. The browser may ask for microphone access only to read device names."
          class="max-w-[200px] cursor-pointer appearance-none truncate rounded border border-dark-50 bg-dark-100 py-1.5 pl-9 pr-8 text-xs text-gray-300 transition-colors hover:bg-dark-50 focus:border-accent-100 focus:outline-none"
          @focus="unlockLabels"
          @change="onOutputChange"
        >
          <option v-if="!supported" value="">Not Supported</option>
          <template v-else>
            <option value="default">Default Output</option>
            <option v-for="(device, i) in outputs" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Speaker ${i + 1}` }}
            </option>
          </template>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500"
        />
      </div>
    </div>
  </div>
</template>
