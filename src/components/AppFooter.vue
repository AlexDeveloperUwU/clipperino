<script setup>
import { Scale } from "@lucide/vue";
import BrandMark from "./BrandMark.vue";
import { useUiStore } from "../stores/ui.js";

const ui = useUiStore();
const year = new Date().getFullYear();
const version = __APP_VERSION__;
</script>

<template>
  <footer class="flex-none border-t border-dark-50 bg-dark-400 px-4 py-2 text-xs text-gray-500">
    <div class="flex items-center justify-between">
      <div class="flex-1 text-left">&copy; {{ year }} AlexDeveloperUwU</div>
      <div class="flex flex-1 items-center justify-center gap-2 text-center">
        <BrandMark class="h-4 w-4" />
        <button
          class="font-semibold text-gray-300 transition-colors hover:text-white"
          title="View changelog"
          @click="ui.open('changelog')"
        >
          Clipperino v{{ version }}
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
