<script setup>
import { ref, watch } from "vue";
import { Save } from "@lucide/vue";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";
import { saveProject, suggestProjectName } from "../../services/projectFile.js";

const ui = useUiStore();
const name = ref("");
const input = ref(null);

watch(
  () => ui.openModal,
  (modal) => {
    if (modal !== "save-project") return;
    name.value = suggestProjectName();
  },
);

async function confirm() {
  if (await saveProject(name.value)) ui.close();
}
</script>

<template>
  <BaseModal name="save-project" @opened="input.select()">
    <h2 class="modal-title mb-4"><Save class="h-5 w-5 text-accent-100" /> Save Project</h2>
    <div class="mb-4">
      <label for="saveProjectName" class="mb-1 block text-xs text-gray-400">File name</label>
      <div class="flex items-center gap-2">
        <input
          id="saveProjectName"
          ref="input"
          v-model="name"
          type="text"
          class="input"
          @keydown.enter.prevent="confirm"
        />
        <span class="font-mono text-sm text-gray-500">.clpproj</span>
      </div>
    </div>
    <div class="flex justify-end gap-3">
      <button class="btn-cancel" @click="ui.close()">Cancel</button>
      <button class="btn-accent" @click="confirm">Save</button>
    </div>
  </BaseModal>
</template>
