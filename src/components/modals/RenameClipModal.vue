<script setup>
import { nextTick, ref, watch } from "vue";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";
import { useProjectStore } from "../../stores/project.js";

const ui = useUiStore();
const project = useProjectStore();
const name = ref("");
const input = ref(null);

watch(
  () => ui.openModal,
  async (modal) => {
    if (modal !== "rename-clip") return;
    name.value = project.clips[ui.modalPayload]?.name ?? "";
    await nextTick();
    input.value?.focus();
  },
);

function save() {
  if (project.renameClip(ui.modalPayload, name.value)) ui.close();
}
</script>

<template>
  <BaseModal name="rename-clip">
    <h2 class="mb-4 text-lg font-bold text-white">Edit Name</h2>
    <div class="mb-4">
      <input
        ref="input"
        v-model="name"
        type="text"
        class="w-full rounded border border-dark-50 bg-dark-300 p-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-100"
        @keydown.enter.prevent="save"
      />
    </div>
    <div class="flex justify-end gap-3">
      <button class="btn-cancel" @click="ui.close()">Cancel</button>
      <button class="btn-accent" @click="save">Update</button>
    </div>
  </BaseModal>
</template>
