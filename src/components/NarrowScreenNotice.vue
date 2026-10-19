<script setup>
import { onBeforeUnmount, ref } from "vue";
import { MonitorSmartphone } from "@lucide/vue";

const query = window.matchMedia("(max-width: 699px)");
const narrow = ref(query.matches);
const dismissed = ref(false);

const update = (event) => (narrow.value = event.matches);
query.addEventListener("change", update);
onBeforeUnmount(() => query.removeEventListener("change", update));
</script>

<template>
  <div
    v-if="narrow && !dismissed"
    class="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-dark-400 p-8 text-center"
    role="alertdialog"
    aria-label="Screen too small"
  >
    <MonitorSmartphone class="h-12 w-12 text-gray-500" aria-hidden="true" />
    <h2 class="text-lg font-bold text-white">Clipperino needs a wider screen</h2>
    <p class="max-w-xs text-sm text-gray-400">
      The editor and timeline are built for tablets, laptops and desktops. Open it on a screen at
      least 700px wide.
    </p>
    <button class="btn-cancel" @click="dismissed = true">Continue anyway</button>
  </div>
</template>
