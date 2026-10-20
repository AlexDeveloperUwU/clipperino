<script setup>
import { CircleCheck, MousePointer2, Plus, RefreshCw } from "@lucide/vue";
import { useProjectStore } from "../../stores/project.js";
import { useUiStore } from "../../stores/ui.js";

const project = useProjectStore();
const ui = useUiStore();

/** Opens the naming dialog for the current selection. */
function addClip() {
  if (project.selected.length === 0) {
    ui.notify("Select at least one transcript to create a clip");
    return;
  }
  ui.open("name-clip");
}
</script>

<template>
  <div data-tour="selection" class="panel h-[35%] min-h-[200px]">
    <div class="panel-header h-12 py-2">
      <div class="flex items-center gap-2">
        <CircleCheck class="h-4 w-4 text-secondary-100" />
        <h2 class="panel-title">Current Selection</h2>
      </div>
      <div class="flex items-center gap-3">
        <span class="rounded bg-secondary-100/10 px-2 py-0.5 font-mono text-xs text-secondary-100"
          >{{ project.selected.length }} lines</span
        >
        <div class="h-4 w-px bg-dark-50"></div>
        <button
          class="text-xs text-gray-400 transition-colors hover:text-white"
          @click="project.clearSelection()"
        >
          Clear All
        </button>
        <button
          :class="
            project.editingClipIndex >= 0
              ? 'bg-accent-200 hover:bg-accent-300'
              : 'bg-secondary-200 hover:bg-secondary-300'
          "
          class="flex items-center gap-2 rounded px-3 py-1 text-xs font-bold uppercase text-white shadow-sm transition-colors"
          @click="addClip"
        >
          <component :is="project.editingClipIndex >= 0 ? RefreshCw : Plus" class="h-3 w-3" />
          {{ project.editingClipIndex >= 0 ? "Update Clip" : "Add Clip" }}
        </button>
      </div>
    </div>

    <div class="flex flex-1 flex-col overflow-y-auto bg-dark-300">
      <table class="w-full flex-none border-collapse">
        <thead class="sticky top-0 z-10 bg-dark-200 shadow-sm">
          <tr class="text-left">
            <th class="th w-24">Start</th>
            <th class="th w-24">End</th>
            <th class="th">Transcript</th>
            <th class="th w-24 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-50">
          <tr
            v-for="item in project.sortedSelected"
            :key="item.index"
            class="border-b border-dark-50/30 transition-colors hover:bg-dark-50"
          >
            <td class="td-time">
              {{ item.inicio }}
            </td>
            <td class="td-time">
              {{ item.fin }}
            </td>
            <td class="px-4 py-2 text-sm leading-relaxed">
              {{ item.transcripcion }}
            </td>
            <td class="px-4 py-2 text-right text-sm">
              <button
                class="rounded border border-dark-50 bg-dark-100 px-2 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-dark-50 hover:text-red-400"
                @click="project.removeSelected(item.index)"
              >
                Remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="project.selected.length === 0"
        class="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-gray-500 opacity-50"
      >
        <MousePointer2 class="h-5 w-5" />
        <span>Select lines from the table above</span>
      </div>
    </div>
  </div>
</template>
