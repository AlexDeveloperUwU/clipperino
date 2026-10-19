<script setup>
import { onMounted } from "vue";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
import ToastList from "./components/ToastList.vue";
import ShiftHint from "./components/ShiftHint.vue";
import EditorTab from "./components/editor/EditorTab.vue";
import PreviewTab from "./components/preview/PreviewTab.vue";
import HelpModal from "./components/modals/HelpModal.vue";
import ChangelogModal from "./components/modals/ChangelogModal.vue";
import StartupModal from "./components/modals/StartupModal.vue";
import SaveProjectModal from "./components/modals/SaveProjectModal.vue";
import ClipNameModal from "./components/modals/ClipNameModal.vue";
import RenameClipModal from "./components/modals/RenameClipModal.vue";
import { useUiStore } from "./stores/ui.js";
import { hasSavedData, startPersistence } from "./services/persistence.js";

const ui = useUiStore();

onMounted(() => {
  if (hasSavedData()) ui.open("startup");
  else startPersistence();
});
</script>

<template>
  <div class="flex h-full flex-col">
    <AppHeader />
    <main class="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <EditorTab v-show="ui.activeTab === 'editor'" />
      <PreviewTab v-show="ui.activeTab === 'preview'" />
    </main>
    <AppFooter />
  </div>

  <ShiftHint />
  <ToastList />
  <HelpModal tab="editor" />
  <HelpModal tab="preview" />
  <ChangelogModal />
  <StartupModal />
  <SaveProjectModal />
  <ClipNameModal />
  <RenameClipModal />
</template>
