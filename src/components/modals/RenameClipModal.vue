<script setup>
import { ref, watch } from "vue";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";
import { useProjectStore } from "../../stores/project.js";

const ui = useUiStore();
const project = useProjectStore();
const name = ref("");

watch(
  () => ui.openModal,
  (modal) => {
    if (modal !== "rename-clip") return;
    name.value = project.clips[ui.modalPayload]?.name ?? "";
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
      <input v-model="name" type="text" class="input" @keydown.enter.prevent="save" />
    </div>
    <div class="flex justify-end gap-3">
      <button class="btn-cancel" @click="ui.close()">Cancel</button>
      <button class="btn-accent" @click="save">Update</button>
    </div>
  </BaseModal>
</template>
