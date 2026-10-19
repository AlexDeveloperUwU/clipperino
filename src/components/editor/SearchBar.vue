<script setup>
import { computed, ref, watch } from "vue";
import { ChevronDown, ChevronUp, X } from "@lucide/vue";
import { useSearchStore } from "../../stores/search.js";

const DEBOUNCE_MS = 300;

const search = useSearchStore();
const text = ref("");
let timer = null;

const counter = computed(() => {
  const total = search.matches.length;
  if (total === 0) return "0/0";
  return `${search.current >= 0 ? search.current + 1 : 1}/${total}`;
});

watch(text, (value) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (value.trim().length === 0) search.clear();
    else search.setTerm(value);
  }, DEBOUNCE_MS);
});

/** Empties the box and cancels any pending search. */
function clear() {
  text.value = "";
  clearTimeout(timer);
  search.clear();
}
</script>

<template>
  <div class="relative">
    <input
      v-model="text"
      type="text"
      placeholder="Search..."
      class="w-64 rounded border border-dark-50 bg-dark-50 px-3 py-1 pr-28 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent-100"
      @keydown.esc="clear"
      @keydown.enter.prevent="search.next()"
    />
    <div class="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
      <span
        class="mr-1 inline-flex min-w-8 items-center justify-center font-mono text-xs text-gray-400"
        >{{ counter }}</span
      >
      <button
        title="Previous Result"
        class="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
        @click="search.prev()"
      >
        <ChevronUp class="h-4 w-4" />
      </button>
      <button
        title="Next Result"
        class="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
        @click="search.next()"
      >
        <ChevronDown class="h-4 w-4" />
      </button>
      <button
        title="Clear Search"
        class="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
        @click="clear"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
