<script setup>
import { Clapperboard, FileJson, FilePen, Film, Pencil, X } from "@lucide/vue";
import { useProjectStore } from "../../stores/project.js";
import { useUiStore } from "../../stores/ui.js";
import { exportClips } from "../../services/exportClips.js";

const project = useProjectStore();
const ui = useUiStore();

/** Removes a clip after confirmation. */
async function deleteClip(index) {
  const accepted = await ui.confirm({
    title: "Delete clip?",
    message: `"${project.clips[index].name}" will be removed. Its lines become available again.`,
    confirmLabel: "Delete",
  });
  if (accepted) project.removeClip(index);
}

const exportBtn =
  "px-3 py-2 bg-dark-50 hover:bg-dark-50/80 text-gray-200 border border-dark-50 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2";
</script>

<template>
  <div class="panel h-full min-h-0">
    <div class="panel-header">
      <h2 class="panel-title flex items-center gap-2">
        <Clapperboard class="h-4 w-4 text-gray-500" /> Created Clips
      </h2>
      <span class="rounded bg-dark-50 px-2 py-0.5 font-mono text-xs text-gray-300">{{
        project.clips.length
      }}</span>
    </div>

    <div class="flex-1 overflow-y-auto bg-dark-300 p-3">
      <p
        v-if="project.clips.length === 0"
        class="fade-in flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-gray-500"
      >
        <Film class="h-8 w-8 opacity-20" />
        <span>No clips created</span>
      </p>
      <div v-else class="space-y-3">
        <div
          v-for="(clip, index) in project.clips"
          :key="index"
          :class="
            index === project.editingClipIndex
              ? 'border-accent-100 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
              : 'border-dark-50'
          "
          :style="{ animationDelay: `${Math.min(index, 3) * 60}ms` }"
          class="clip-item relative rounded border bg-dark-200 p-3 transition-all hover:border-dark-50/80"
        >
          <div class="mb-2 flex items-start justify-between">
            <h3 class="flex items-center gap-2 truncate pr-16 text-sm font-bold text-white">
              <span class="truncate">{{ clip.name }}</span>
              <span
                v-if="index === project.editingClipIndex"
                class="rounded bg-accent-200 px-1 text-[10px] font-normal text-white"
                >Editing</span
              >
            </h3>
            <div class="absolute right-3 top-3 flex items-center gap-1">
              <button
                class="p-1 text-gray-500 transition-colors hover:text-accent-100"
                title="Edit Content"
                :data-tour="index === 0 ? 'clip-edit' : undefined"
                @click="project.editClip(index)"
              >
                <FilePen class="h-3.5 w-3.5" />
              </button>
              <button
                class="p-1 text-gray-500 transition-colors hover:text-white"
                title="Rename"
                @click="ui.open('rename-clip', index)"
              >
                <Pencil class="h-3.5 w-3.5" />
              </button>
              <button
                class="p-1 text-gray-500 transition-colors hover:text-red-400"
                title="Delete"
                @click="deleteClip(index)"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>
          <p class="mb-2 line-clamp-2 text-xs text-gray-400">
            {{ clip.transcriptions[0]?.transcripcion }}
          </p>
          <div class="mb-2 flex flex-wrap gap-1.5">
            <span
              class="rounded border border-dark-50 bg-dark-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-400"
              >{{ clip.inicio }}</span
            >
            <span class="self-center text-[10px] text-gray-600">to</span>
            <span
              class="rounded border border-dark-50 bg-dark-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-400"
              >{{ clip.fin }}</span
            >
            <span
              class="ml-auto rounded bg-accent-100/10 px-1.5 py-0.5 font-mono text-[10px] text-accent-100"
              >{{ clip.duration }}</span
            >
          </div>
          <div
            class="mt-1 flex items-center justify-between border-t border-dark-50/50 pt-1 text-[10px] text-gray-500"
          >
            <span>{{ clip.lines }} lines</span>
            <span class="opacity-50">#{{ index + 1 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-none border-t border-dark-50 bg-dark-100 p-3">
      <div data-tour="export" class="grid grid-cols-2 gap-2">
        <button
          :class="exportBtn"
          :disabled="project.clips.length === 0"
          class="disabled:cursor-not-allowed disabled:opacity-40"
          @click="exportClips('json')"
        >
          <FileJson class="h-3 w-3 text-accent-100" /> JSON
        </button>
        <button
          :disabled="project.clips.length === 0"
          class="flex items-center justify-center gap-2 rounded bg-accent-200 px-3 py-2 text-xs font-bold uppercase text-white shadow-lg shadow-accent-100/10 transition-colors hover:bg-accent-300 disabled:cursor-not-allowed disabled:opacity-40"
          title="Timeline for DaVinci Resolve / Premiere"
          @click="exportClips('edl')"
        >
          <Film class="h-4 w-4" /> EDL
        </button>
      </div>
    </div>
  </div>
</template>
