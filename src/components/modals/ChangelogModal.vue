<script setup>
import { computed } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ScrollText, X } from "lucide-vue-next";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";
import changelog from "../../../CHANGELOG.md?raw";

const ui = useUiStore();
const html = computed(() => DOMPurify.sanitize(marked.parse(changelog)));
</script>

<template>
  <BaseModal name="changelog" width-class="max-w-2xl">
    <div class="flex max-h-[80vh] flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-lg font-bold text-white">
          <ScrollText class="h-5 w-5 text-accent-100" /> Changelog
        </h2>
        <button class="text-gray-400 transition-colors hover:text-white" @click="ui.close()">
          <X class="h-5 w-5" />
        </button>
      </div>
      <div
        class="changelog-content flex-1 overflow-y-auto text-sm text-gray-300"
        v-html="html"
      ></div>
    </div>
  </BaseModal>
</template>
