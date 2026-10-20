<script setup>
import { computed, ref, watch } from "vue";
import { Tag } from "@lucide/vue";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";
import { useProjectStore } from "../../stores/project.js";

const ui = useUiStore();
const project = useProjectStore();
const name = ref("");

const isUpdate = computed(() => project.editingClipIndex >= 0);

watch(
  () => ui.openModal,
  (modal) => {
    if (modal !== "name-clip") return;
    name.value = isUpdate.value ? project.clips[project.editingClipIndex].name : "";
  },
);

function save() {
  if (project.saveClip(name.value)) ui.close();
}
</script>

<template>
  <BaseModal name="name-clip" tour="name-clip">
    <h2 class="modal-title mb-4"><Tag class="h-5 w-5 text-secondary-100" /> Name Clip</h2>
    <div class="mb-4">
      <label for="clipName" class="mb-2 block text-xs font-bold uppercase text-gray-400"
        >Clip Name</label
      >
      <input
        id="clipName"
        v-model="name"
        type="text"
        placeholder="Ex: Epic Intro"
        class="input focus:border-transparent focus:ring-secondary-100"
        @keydown.enter.prevent="save"
      />
    </div>
    <p class="mb-6 rounded border border-dark-50 bg-dark-300 p-2 text-xs text-gray-400">
      You selected {{ project.selected.length }} lines for this clip.
    </p>
    <div class="flex justify-end gap-3">
      <button class="btn-cancel" @click="ui.close()">Cancel</button>
      <button class="btn-secondary" @click="save">
        {{ isUpdate ? "Update Clip" : "Save Clip" }}
      </button>
    </div>
  </BaseModal>
</template>
