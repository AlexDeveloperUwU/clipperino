<script setup>
import { ref } from "vue";
import { ScrollText, X } from "@lucide/vue";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";

const ui = useUiStore();
const html = ref("");

/** Renders the changelog on first open; the markdown libraries load as a separate chunk. */
async function loadChangelog() {
  if (html.value) return;
  const [{ marked }, { default: DOMPurify }, { default: changelog }] = await Promise.all([
    import("marked"),
    import("dompurify"),
    import("../../../CHANGELOG.md?raw"),
  ]);
  html.value = DOMPurify.sanitize(marked.parse(changelog));
}
</script>

<template>
  <BaseModal name="changelog" width-class="max-w-2xl" @opened="loadChangelog">
    <div class="flex max-h-[80vh] flex-col">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="modal-title"><ScrollText class="h-5 w-5 text-accent-100" /> Changelog</h2>
        <button class="text-gray-400 transition-colors hover:text-white" @click="ui.close()">
          <X class="h-5 w-5" />
        </button>
      </div>
      <div
        :class="html ? 'opacity-100' : 'opacity-0'"
        class="changelog-content min-h-[50vh] flex-1 overflow-y-auto text-sm text-gray-300 transition-opacity duration-300"
        v-html="html"
      ></div>
    </div>
  </BaseModal>
</template>
