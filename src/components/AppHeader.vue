<script setup>
import { CircleHelp, FileSpreadsheet, Film, FolderOpen, Save, Trash2 } from "@lucide/vue";
import BrandMark from "./BrandMark.vue";
import { useUiStore } from "../stores/ui.js";
import { useProjectStore } from "../stores/project.js";
import { useMediaStore } from "../stores/media.js";
import { importCsvFile } from "../services/importCsv.js";
import { openProject } from "../services/projectFile.js";
import { forgetVideo, openVideo } from "../services/videoPicker.js";
import { useFilePicker } from "../composables/useFilePicker.js";

const {
  input: videoInput,
  open: openVideoPicker,
  onChange: onVideoChange,
} = useFilePicker((file) => media.load(file));
const {
  input: csvInput,
  open: openCsvPicker,
  onChange: onCsvChange,
} = useFilePicker(importCsvFile);
const {
  input: projectInput,
  open: openProjectPicker,
  onChange: onProjectChange,
} = useFilePicker(openProject);
const ui = useUiStore();
const project = useProjectStore();
const media = useMediaStore();

const TABS = [
  { id: "editor", label: "Editor", help: "How to use the Editor" },
  { id: "preview", label: "Preview", help: "How to use the Preview" },
];

const actionBtn =
  "px-3 py-1.5 text-white text-xs font-bold uppercase tracking-wide rounded cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap bg-accent-200 hover:bg-accent-300 shadow-lg shadow-accent-100/20";
const dangerBtn =
  "px-3 py-1.5 bg-dark-100 hover:bg-red-900/30 text-xs font-medium rounded cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap text-red-400 hover:text-red-300";
const projectBtn =
  "px-3 py-1.5 bg-dark-100 hover:bg-dark-50 text-gray-300 hover:text-white text-xs font-medium rounded cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap";

/** Opens the video picker, falling back to the hidden file input where the browser has none. */
async function onLoadVideo() {
  if (!(await openVideo())) openVideoPicker();
}

/** Wipes transcript and clips after confirmation. */
async function onClearData() {
  const accepted = await ui.confirm({
    title: "Clear all data?",
    message: "This removes the transcript, selection and every clip. It cannot be undone.",
    confirmLabel: "Clear data",
  });
  if (accepted) project.clearAll();
}

/** Unloads the video after confirmation. */
async function onClearVideo() {
  const accepted = await ui.confirm({
    title: "Clear the video?",
    message: "You will need to load the video file again to preview clips.",
    confirmLabel: "Clear video",
  });
  if (accepted) forgetVideo();
}

/** Opens the save dialog, or explains why there is nothing to save. */
function onSaveProject() {
  if (!project.isActive) {
    ui.notify("Nothing to save yet — load a transcript or create clips");
    return;
  }
  ui.open("save-project");
}
</script>

<template>
  <header
    class="z-10 flex flex-none items-center justify-between border-b border-dark-50 bg-dark-400 px-4 py-3"
  >
    <div class="flex items-center gap-4">
      <h1 class="flex items-center gap-2 text-xl font-bold text-white">
        <BrandMark class="h-8 w-8" /> Clipperino
      </h1>
      <div class="mx-2 h-6 w-px bg-dark-50"></div>
      <div class="flex items-center gap-1" role="tablist">
        <div
          v-for="tab in TABS"
          :key="tab.id"
          :data-tour="`tab-${tab.id}`"
          role="presentation"
          :class="ui.activeTab === tab.id ? 'bg-dark-100' : 'hover:bg-dark-50'"
          class="group flex items-center rounded-md transition-colors"
        >
          <button
            role="tab"
            :aria-selected="ui.activeTab === tab.id"
            :class="ui.activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-white'"
            class="py-1.5 pl-3 pr-1.5 text-sm font-medium transition-colors"
            @click="
              ui.activeTab = tab.id;
              $event.currentTarget.blur();
            "
          >
            {{ tab.label }}
          </button>
          <button
            :title="tab.help"
            :class="ui.activeTab === tab.id ? 'text-gray-400' : 'text-gray-500'"
            class="py-1.5 pl-0.5 pr-2.5 transition-colors hover:text-accent-100"
            @click="ui.open(`help-${tab.id}`)"
          >
            <CircleHelp class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div data-tour="project" class="mr-1 flex items-center gap-2 border-r border-dark-50 pr-3">
        <button
          title="Save the current session as a .clpproj file"
          :class="projectBtn"
          @click="onSaveProject"
        >
          <Save class="h-4 w-4" /> <span>Save<span class="hidden lg:inline"> Project</span></span>
        </button>
        <button
          title="Open a saved .clpproj project file"
          :class="projectBtn"
          @click="openProjectPicker"
        >
          <FolderOpen class="h-4 w-4" />
          <span>Open<span class="hidden lg:inline"> Project</span></span>
        </button>
        <input
          ref="projectInput"
          type="file"
          class="hidden"
          accept=".clpproj"
          @change="onProjectChange"
        />
      </div>

      <div v-if="ui.activeTab === 'editor'" data-tour="import" class="flex items-center gap-2">
        <button
          v-if="project.transcriptions.length === 0"
          :class="actionBtn"
          @click="openCsvPicker"
        >
          <FileSpreadsheet class="h-4 w-4" /> <span>Import CSV</span>
        </button>
        <input ref="csvInput" type="file" class="hidden" accept=".csv" @change="onCsvChange" />
        <button v-if="project.transcriptions.length > 0" :class="dangerBtn" @click="onClearData()">
          <Trash2 class="h-4 w-4" /> <span>Clear Data</span>
        </button>
      </div>

      <div v-else class="flex items-center gap-2">
        <button
          v-if="!media.hasMedia"
          :class="actionBtn"
          :title="media.needsReload ? `Reopen ${media.meta.name}` : 'Choose a video file'"
          @click="onLoadVideo"
        >
          <Film class="h-4 w-4" />
          <span>{{ media.needsReload ? "Re-import Video" : "Load Video" }}</span>
        </button>
        <input
          ref="videoInput"
          type="file"
          class="hidden"
          accept="video/*"
          @change="onVideoChange"
        />
        <button v-if="media.hasMedia || media.needsReload" :class="dangerBtn" @click="onClearVideo">
          <Trash2 class="h-4 w-4" /> <span>Clear Video</span>
        </button>
      </div>
    </div>
  </header>
</template>
