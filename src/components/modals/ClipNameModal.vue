<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { Tag } from "lucide-vue-next";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";
import { useProjectStore } from "../../stores/project.js";

const ui = useUiStore();
const project = useProjectStore();
const name = ref("");
const input = ref(null);

const isUpdate = computed(() => project.editingClipIndex >= 0);

watch(
  () => ui.openModal,
  async (modal) => {
    if (modal !== "name-clip") return;
    name.value = isUpdate.value ? project.clips[project.editingClipIndex].name : "";
    await nextTick();
    input.value?.focus();
  },
);

function save() {
  if (project.saveClip(name.value)) ui.close();
}
</script>

<template>
  <BaseModal name="name-clip">
    <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-white">
      <Tag class="h-5 w-5 text-secondary-100" /> Name Clip
    </h2>
    <div class="mb-4">
      <label for="clipName" class="mb-2 block text-xs font-bold uppercase text-gray-400"
        >Clip Name</label
      >
      <input
        id="clipName"
        ref="input"
        v-model="name"
        type="text"
        placeholder="Ex: Epic Intro"
        class="w-full rounded border border-dark-50 bg-dark-300 p-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secondary-100"
        @keydown.enter.prevent="save"
      />
    </div>
    <p class="mb-6 rounded border border-dark-50 bg-dark-300 p-2 text-xs text-gray-400">
      You selected {{ project.selected.length }} lines for this clip.
    </p>
    <div class="flex justify-end gap-3">
      <button class="btn-cancel" @click="ui.close()">Cancel</button>
      <button
        class="rounded bg-secondary-100 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-secondary-100/20 transition-colors hover:bg-secondary-200"
        @click="save"
      >
        {{ isUpdate ? "Update Clip" : "Save Clip" }}
      </button>
    </div>
  </BaseModal>
</template>
