<script setup>
import { onMounted } from "vue";
import { FileDown } from "@lucide/vue";
import DropOverlay from "./components/DropOverlay.vue";
import { useFileDrop } from "./composables/useFileDrop.js";
import { routeDrop } from "./services/dropRouter.js";
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
import ConfirmModal from "./components/modals/ConfirmModal.vue";
import WelcomeModal from "./components/modals/WelcomeModal.vue";
import DemoBanner from "./components/DemoBanner.vue";
import TourOverlay from "./components/TourOverlay.vue";
import NarrowScreenNotice from "./components/NarrowScreenNotice.vue";
import { useUiStore } from "./stores/ui.js";
import {
  hasSavedData,
  hasSeenWelcome,
  markWelcomeSeen,
  startPersistence,
} from "./services/persistence.js";

const ui = useUiStore();
const { dragging, handlers } = useFileDrop(routeDrop);

/** Both tabs stay laid out and cross-fade; the inactive one is inert so the video and timeline are never rebuilt on a switch. */
const tabClass = (id) => [
  "absolute inset-0 transition-opacity duration-300 ease-out",
  ui.activeTab === id ? "opacity-100" : "pointer-events-none opacity-[0.001]",
];

onMounted(() => {
  if (hasSavedData()) {
    ui.open("startup");
    return;
  }
  startPersistence();
  if (!hasSeenWelcome()) {
    markWelcomeSeen();
    ui.open("welcome");
  }
});
</script>

<template>
  <div class="relative flex h-full flex-col" v-bind="handlers">
    <AppHeader />
    <DemoBanner />
    <main
      :class="ui.swapping ? 'pointer-events-none opacity-0' : 'opacity-100'"
      class="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden transition-opacity duration-300 ease-out"
    >
      <EditorTab :inert="ui.activeTab !== 'editor'" :class="tabClass('editor')" />
      <PreviewTab :inert="ui.activeTab !== 'preview'" :class="tabClass('preview')" />
    </main>
    <AppFooter />

    <DropOverlay
      :visible="dragging"
      title="Drop a file to open it"
      subtitle="CSV transcript, video or .clpproj project"
    >
      <FileDown class="h-20 w-20 animate-bounce text-accent-100" />
    </DropOverlay>
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
  <ConfirmModal />
  <WelcomeModal />
  <TourOverlay />
  <NarrowScreenNotice />
</template>
