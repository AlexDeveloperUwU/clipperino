<script setup>
import { ref, watch } from "vue";
import { Check, RefreshCw, Scale } from "@lucide/vue";
import BrandMark from "./BrandMark.vue";
import { useUiStore } from "../stores/ui.js";
import { applyUpdate } from "../services/pwa.js";

const SAVED_VISIBLE_MS = 1800;

const ui = useUiStore();
const year = new Date().getFullYear();
const version = __APP_VERSION__;
const showSaved = ref(false);
let savedTimer = null;

watch(
  () => ui.savedAt,
  () => {
    showSaved.value = true;
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (showSaved.value = false), SAVED_VISIBLE_MS);
  },
);
</script>

<template>
  <footer class="flex-none border-t border-dark-50 bg-dark-400 px-4 py-2 text-xs text-gray-500">
    <div class="flex items-center justify-between">
      <div class="flex flex-1 items-center gap-3 text-left">
        <span>&copy; {{ year }} AlexDeveloperUwU</span>
        <span
          :class="showSaved ? 'opacity-100' : 'opacity-0'"
          class="flex items-center gap-1 text-gray-500 transition-opacity duration-500"
          aria-hidden="true"
        >
          <Check class="h-3 w-3" /> Saved
        </span>
      </div>
      <div class="flex flex-1 items-center justify-center gap-2 text-center">
        <BrandMark class="h-4 w-4" />
        <button
          class="font-semibold text-gray-300 transition-colors hover:text-white"
          title="View changelog"
          @click="ui.open('changelog')"
        >
          Clipperino v{{ version }}
        </button>
        <button
          v-if="ui.updateReady"
          class="flex items-center gap-1 rounded bg-accent-200 px-2 py-0.5 font-medium text-white transition-colors hover:bg-accent-300"
          title="Reload to use the new version"
          @click="applyUpdate"
        >
          <RefreshCw class="h-3 w-3" /> Update available
        </button>
      </div>
      <div class="flex-1 text-right">
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          class="inline-flex items-center gap-1 transition-colors hover:text-accent-100"
        >
          <Scale class="h-3 w-3" /> AGPL v3
        </a>
      </div>
    </div>
  </footer>
</template>
