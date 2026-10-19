<script setup>
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";

const ui = useUiStore();
</script>

<template>
  <BaseModal name="confirm">
    <h2 class="mb-2 text-lg font-bold text-white">{{ ui.modalPayload?.title }}</h2>
    <p class="mb-6 text-sm text-gray-400">{{ ui.modalPayload?.message }}</p>
    <div class="flex justify-end gap-3">
      <button class="btn-cancel" @click="ui.answerConfirm(false)">Cancel</button>
      <button
        class="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
        @click="ui.answerConfirm(true)"
      >
        {{ ui.modalPayload?.confirmLabel }}
      </button>
    </div>
  </BaseModal>
</template>
