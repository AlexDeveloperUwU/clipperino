<script setup>
import { History } from "@lucide/vue";
import BaseModal from "../BaseModal.vue";
import { useUiStore } from "../../stores/ui.js";
import { clearSavedData, loadSession, startPersistence } from "../../services/persistence.js";

const ui = useUiStore();

/** Restores the saved session and begins auto-saving. */
function load() {
  ui.close();
  loadSession();
  startPersistence();
}

/** Discards the saved session and begins auto-saving a new one. */
function startFresh() {
  ui.close();
  clearSavedData();
  startPersistence();
}
</script>

<template>
  <BaseModal name="startup" :dismissible="false">
    <h2 class="modal-title mb-2"><History class="h-5 w-5 text-secondary-100" /> Welcome back</h2>
    <p class="mb-6 text-sm text-gray-400">
      We found a saved session from your last visit. Would you like to pick up where you left off,
      or start fresh?
    </p>
    <div class="flex justify-end gap-3">
      <button
        class="rounded bg-dark-100 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-red-900/30 hover:text-red-300"
        @click="startFresh"
      >
        Start fresh
      </button>
      <button class="btn-secondary" @click="load">Load previous session</button>
    </div>
  </BaseModal>
</template>
