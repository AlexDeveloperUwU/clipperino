import {
  csvFileInput,
  transcriptionsTable,
  status,
  selectedTranscriptionsTable,
  selectedCount,
  csvFileLabel,
  clearCsvBtn,
  clipNameInput,
  nameClipModal,
  selectedLinesInfo,
  cancelClipBtn,
  saveClipBtn,
  clearAllBtn,
  addClipBtn,
  clipList,
  clipCount,
  exportJsonBtn,
  exportMarkdownBtn,
  exportEDLBtn,
  editClipNameModal,
  editClipNameInput,
  cancelEditBtn,
  saveEditBtn,
} from "./elements.js";
import {
  transcriptions,
  selectedTranscriptions,
  clips,
  setSelectedTranscriptions,
  setClips,
  currentEditingClipIndex,
  setCurrentEditingClipIndex,
  lastSelectedIndex,
  setLastSelectedIndex,
  setTranscriptions,
} from "./state.js";
import { showNotification, debounce } from "./ui.js";
import { parseCSV, calculateDuration } from "./csvParser.js";
import { saveToLocalStorage } from "./storage.js";
import { exportEDL } from "./edlExporter.js";
import { updateSearchAfterRowsLoaded } from "./search.js";

export function initEditorTab() {
  initEventListeners();
  window.renderClips = renderClips;
}

function initEventListeners() {
  csvFileInput.addEventListener("change", handleFileUpload);
  exportJsonBtn.addEventListener("click", exportClips);
  exportMarkdownBtn.addEventListener("click", exportMarkdown);
  exportEDLBtn.addEventListener("click", exportEDLFile);
  addClipBtn.addEventListener("click", openNameClipModal);
  clearAllBtn.addEventListener("click", clearSelectedTranscriptions);
  cancelClipBtn.addEventListener("click", closeNameClipModal);
  saveClipBtn.addEventListener("click", saveClip);
  clearCsvBtn.addEventListener("click", clearTranscriptions);
  cancelEditBtn.addEventListener("click", closeEditClipNameModal);
  saveEditBtn.addEventListener("click", saveEditedClipName);

  clipNameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveClip();
    }
  });

  editClipNameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEditedClipName();
    }
  });
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      parseCSV(text, true);
    };
    reader.readAsText(file);
  }
}

export function navigateToLine(lineIndex) {
  if (lineIndex < 0 || transcriptions.length === 0) return;

  const targetIndex = Math.min(lineIndex, transcriptions.length - 1);
  transcriptionsTable.innerHTML = "";

  const batchSize = 200;
  const batchesToLoad = Math.floor(targetIndex / batchSize) + 1;

  for (let i = 0; i < batchesToLoad; i++) {
    loadBatch(i * batchSize, batchSize);
  }

  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    const targetRow = document.querySelector(`tr[data-index="${targetIndex}"]`);
    if (targetRow) {
      const tableContainer = document.getElementById("transcriptionsContainer");
      if (tableContainer) {
        targetRow.scrollIntoView({ block: 'center' });
      }

      targetRow.classList.add("highlight-row");
      setTimeout(() => targetRow.classList.remove("highlight-row"), 2000);
    }
  }, 100);
}

export function renderTable(scrollToIndex = -1) {
  transcriptionsTable.innerHTML = "";

  if (scrollToIndex > -1) {
    return navigateToLine(scrollToIndex);
  }

  const totalRows = transcriptions.length;
  const batchSize = 200;

  loadBatch(0, batchSize);

  if (window.lucide) window.lucide.createIcons();

  const tableContainer = document.getElementById("transcriptionsContainer");

  if (tableContainer) {
    if (tableContainer._scrollHandler) {
      tableContainer.removeEventListener("scroll", tableContainer._scrollHandler);
    }

    tableContainer._scrollHandler = debounce(function () {
      const lastRow = transcriptionsTable.lastElementChild;
      if (!lastRow) return;

      const lastRowIndex = parseInt(lastRow.dataset.index);

      if (
        tableContainer.scrollTop + tableContainer.clientHeight > tableContainer.scrollHeight - 300 &&
        lastRowIndex < totalRows - 1
      ) {
        loadMoreRows(lastRowIndex + 1);
      }
    }, 100);

    tableContainer.addEventListener("scroll", tableContainer._scrollHandler);
  }

  if (scrollToIndex > -1) {
    setTimeout(() => {
      const targetRow = document.querySelector(`tr[data-index="${scrollToIndex}"]`);
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
        targetRow.classList.add("highlight-row");
        setTimeout(() => targetRow.classList.remove("highlight-row"), 2000);
      }
    }, 100);
  }

  if (!transcriptionsTable.hasEventListener) {
    transcriptionsTable.addEventListener("click", function (e) {
      const selectBtn = e.target.closest(".select-btn");
      if (selectBtn) {
        const row = selectBtn.closest("tr");
        const index = parseInt(row.dataset.index);

        if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== undefined && lastSelectedIndex !== -1) {
          const startIdx = Math.min(lastSelectedIndex, index);
          const endIdx = Math.max(lastSelectedIndex, index);
          selectTranscriptionRange(startIdx, endIdx);
        } else {
          selectTranscription(index);
          setLastSelectedIndex(index);
        }
      }
    });
    transcriptionsTable.hasEventListener = true;
  }

  updateSelectedTable();
}

function loadBatch(startIndex, batchSize) {
  const endIndex = Math.min(startIndex + batchSize, transcriptions.length);
  const fragment = document.createDocumentFragment();

  for (let i = startIndex; i < endIndex; i++) {
    const item = transcriptions[i];
    const row = document.createElement("tr");
    row.className = "hover:bg-dark-100 transition-colors border-b border-dark-50/30";
    row.dataset.index = i;

    const isSelected = selectedTranscriptions.some((t) => t.index === i);
    const isInClip = isTranscriptionInClip(i);

    if (isSelected) {
      row.classList.add("bg-accent-100/10");
    }
    if (isInClip) {
      row.classList.add("in-clip");
    }

    row.innerHTML = `
      <td class="px-4 py-2 text-xs font-mono text-gray-400">${item.inicio}</td>
      <td class="px-4 py-2 text-xs font-mono text-gray-400">${item.fin}</td>
      <td class="px-4 py-2 text-sm leading-relaxed">${item.transcripcion}</td>
      <td class="px-4 py-2 text-sm text-right">
        ${isInClip
        ? '<span class="text-xs text-gray-500 font-medium">Used</span>'
        : `<button class="select-btn px-2 py-1 ${isSelected ? "bg-accent-100 text-white" : "bg-dark-100 text-gray-300 hover:bg-dark-50"
        } rounded text-xs font-medium transition-colors border border-transparent ${!isSelected ? 'border-dark-50' : ''}">
            ${isSelected ? "Selected" : "Select"}
          </button>`
      }
      </td>
    `;

    fragment.appendChild(row);
  }

  transcriptionsTable.appendChild(fragment);
}

function isTranscriptionInClip(index) {
  return clips.some((clip) => clip.transcriptions.some((t) => t.index === index));
}

function loadMoreRows(startIndex) {
  const batchSize = 50;
  const endIndex = Math.min(startIndex + batchSize, transcriptions.length);

  const fragment = document.createDocumentFragment();

  for (let i = startIndex; i < endIndex; i++) {
    const item = transcriptions[i];
    const row = document.createElement("tr");
    row.className = "hover:bg-dark-100 transition-colors border-b border-dark-50/30";
    row.dataset.index = i;

    const isSelected = selectedTranscriptions.some((t) => t.index === i);
    const isInClip = isTranscriptionInClip(i);

    if (isSelected) {
      row.classList.add("bg-accent-100/10");
    }
    if (isInClip) {
      row.classList.add("in-clip");
    }

    row.innerHTML = `
      <td class="px-4 py-2 text-xs font-mono text-gray-400">${item.inicio}</td>
      <td class="px-4 py-2 text-xs font-mono text-gray-400">${item.fin}</td>
      <td class="px-4 py-2 text-sm leading-relaxed">${item.transcripcion}</td>
      <td class="px-4 py-2 text-sm text-right">
        ${isInClip
        ? '<span class="text-xs text-gray-500 font-medium">Used</span>'
        : `<button class="select-btn px-2 py-1 ${isSelected ? "bg-accent-100 text-white" : "bg-dark-100 text-gray-300 hover:bg-dark-50"
        } rounded text-xs font-medium transition-colors border border-transparent ${!isSelected ? 'border-dark-50' : ''}">
              ${isSelected ? "Selected" : "Select"}
            </button>`
      }
      </td>
    `;

    fragment.appendChild(row);
  }

  transcriptionsTable.appendChild(fragment);
  updateSearchAfterRowsLoaded();

  if (window.lucide) window.lucide.createIcons();
}

function selectTranscriptionRange(startIdx, endIdx) {
  const newSelected = [...selectedTranscriptions];
  let addedCount = 0;

  for (let i = startIdx; i <= endIdx; i++) {
    if (i >= transcriptions.length) continue;

    const transcription = transcriptions[i];
    const isAlreadySelected = newSelected.some((t) => t.index === i);

    if (!isAlreadySelected) {
      newSelected.push({
        ...transcription,
        index: i,
      });
      addedCount++;
    }
  }

  setSelectedTranscriptions(newSelected);
  setLastSelectedIndex(endIdx);

  updateRowRange(startIdx, endIdx);
  updateSelectedTable();
  saveToLocalStorage();

  if (addedCount > 0) {
    showNotification(`${addedCount} lines selected`);
  }
}

function updateSingleRow(index) {
  const row = document.querySelector(`tr[data-index="${index}"]`);
  if (!row) return;

  const isSelected = selectedTranscriptions.some((t) => t.index === index);

  if (isSelected) {
    row.classList.add("bg-accent-100/10");
  } else {
    row.classList.remove("bg-accent-100/10");
  }

  const selectBtn = row.querySelector(".select-btn");
  if (selectBtn) {
    if (isSelected) {
      selectBtn.classList.remove("bg-dark-100", "hover:bg-dark-50", "text-gray-300", "border-dark-50");
      selectBtn.classList.add("bg-accent-100", "text-white");
      selectBtn.textContent = "Selected";
    } else {
      selectBtn.classList.remove("bg-accent-100", "text-white");
      selectBtn.classList.add("bg-dark-100", "hover:bg-dark-50", "text-gray-300", "border-dark-50");
      selectBtn.textContent = "Select";
    }
  }
}

function updateRowRange(startIdx, endIdx) {
  for (let i = startIdx; i <= endIdx; i++) {
    updateSingleRow(i);
  }
}

function selectTranscription(index) {
  if (index < 0 || index >= transcriptions.length) return;

  const transcription = transcriptions[index];
  const existingIndex = selectedTranscriptions.findIndex((t) => t.index === index);
  const newSelected = [...selectedTranscriptions];

  if (existingIndex !== -1) {
    newSelected.splice(existingIndex, 1);
  } else {
    newSelected.push({
      ...transcription,
      index,
    });
  }

  setSelectedTranscriptions(newSelected);
  setLastSelectedIndex(index);

  localStorage.setItem("clipperino_last_viewed_line", index.toString());

  updateSingleRow(index);
  updateSelectedTable();
  saveToLocalStorage();
}

function clearSelectedTranscriptions() {
  setSelectedTranscriptions([]);
  setLastSelectedIndex(-1);

  renderTable();
  updateSelectedTable();
  saveToLocalStorage();
}

export function updateStatus() {
  status.textContent = `${transcriptions.length} lines`;
  toggleImportButton();
}

export function toggleImportButton() {
  if (transcriptions.length > 0) {
    csvFileLabel.classList.add("hidden");
    clearCsvBtn.classList.remove("hidden");
  } else {
    csvFileLabel.classList.remove("hidden");
    clearCsvBtn.classList.add("hidden");
  }
}

function openNameClipModal() {
  if (selectedTranscriptions.length === 0) {
    showNotification("Select at least one transcript to create a clip");
    return;
  }

  nameClipModal.classList.add("opacity-100", "pointer-events-auto");
  nameClipModal.querySelector('div').classList.remove("scale-95");
  nameClipModal.querySelector('div').classList.add("scale-100");

  clipNameInput.value = "";
  selectedLinesInfo.textContent = `You selected ${selectedTranscriptions.length} lines for this clip.`;

  setTimeout(() => clipNameInput.focus(), 100);
}

function closeNameClipModal() {
  nameClipModal.classList.remove("opacity-100", "pointer-events-auto");
  nameClipModal.querySelector('div').classList.add("scale-95");
  nameClipModal.querySelector('div').classList.remove("scale-100");
}

function saveClip() {
  const clipName = clipNameInput.value.trim() || "Untitled Clip";

  if (selectedTranscriptions.length === 0) {
    showNotification("Select at least one transcript to create a clip");
    return;
  }

  const sortedTranscriptions = [...selectedTranscriptions].sort((a, b) => a.index - b.index);

  const duration = calculateDuration(
    sortedTranscriptions[0].inicio,
    sortedTranscriptions[sortedTranscriptions.length - 1].fin
  );

  const newClip = {
    name: clipName,
    inicio: sortedTranscriptions[0].inicio,
    fin: sortedTranscriptions[sortedTranscriptions.length - 1].fin,
    duration: duration.formatted,
    totalSeconds: duration.totalSeconds,
    lines: sortedTranscriptions.length,
    transcriptions: sortedTranscriptions,
    timestamp: new Date().toISOString(),
  };

  const newClips = [...clips, newClip];
  setClips(newClips);

  renderClips();
  closeNameClipModal();
  updateClipCount();
  clearSelectedTranscriptions();
  saveToLocalStorage();

  showNotification("Clip saved successfully");
}

export function renderClips() {
  clipList.innerHTML = "";

  if (clips.length === 0) {
    clipList.innerHTML = '<p class="text-xs text-gray-500 text-center py-10 flex flex-col gap-2 items-center"><i data-lucide="film" class="w-8 h-8 opacity-20"></i><span>No clips created</span></p>';
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  clips.forEach((clip, index) => {
    const clipDiv = document.createElement("div");
    clipDiv.className = "clip-item bg-dark-200 border border-dark-50 rounded p-3 relative hover:border-dark-50/80 transition-all";

    clipDiv.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-sm text-white flex items-center gap-2 truncate pr-6">
          <span class="truncate">${clip.name}</span>
          <button class="edit-clip-name-btn text-gray-500 hover:text-accent-100 transition-colors" data-index="${index}">
            <i data-lucide="pencil" class="w-3 h-3"></i>
          </button>
        </h3>
        <button class="remove-clip-btn text-gray-500 hover:text-red-400 transition-colors absolute top-3 right-3">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5 mb-2">
        <span class="bg-dark-100 text-[10px] px-1.5 py-0.5 rounded text-gray-400 font-mono border border-dark-50">
          ${clip.inicio}
        </span>
        <span class="text-gray-600 text-[10px] self-center">to</span>
        <span class="bg-dark-100 text-[10px] px-1.5 py-0.5 rounded text-gray-400 font-mono border border-dark-50">
          ${clip.fin}
        </span>
        <span class="bg-accent-100/10 text-accent-100 text-[10px] px-1.5 py-0.5 rounded font-mono ml-auto">
          ${clip.duration}
        </span>
      </div>
      <div class="text-[10px] text-gray-500 flex justify-between items-center mt-1 pt-1 border-t border-dark-50/50">
        <span>${clip.lines} lines</span>
        <span class="opacity-50">#${index + 1}</span>
      </div>
    `;

    const removeBtn = clipDiv.querySelector(".remove-clip-btn");
    removeBtn.addEventListener("click", () => removeClip(index));

    const editNameBtn = clipDiv.querySelector(".edit-clip-name-btn");
    editNameBtn.addEventListener("click", () => openEditClipNameModal(index));

    clipList.appendChild(clipDiv);
  });

  if (window.lucide) window.lucide.createIcons();

  updateClipCount();
}

function removeClip(index) {
  const newClips = [...clips];
  newClips.splice(index, 1);
  setClips(newClips);

  renderClips();
  updateClipCount();
  saveToLocalStorage();
}

function openEditClipNameModal(index) {
  setCurrentEditingClipIndex(index);
  const clip = clips[index];

  editClipNameInput.value = clip.name;
  editClipNameModal.classList.add("opacity-100", "pointer-events-auto");
  editClipNameModal.querySelector('div').classList.remove("scale-95");
  editClipNameModal.querySelector('div').classList.add("scale-100");

  setTimeout(() => editClipNameInput.focus(), 100);
}

function closeEditClipNameModal() {
  editClipNameModal.classList.remove("opacity-100", "pointer-events-auto");
  editClipNameModal.querySelector('div').classList.add("scale-95");
  editClipNameModal.querySelector('div').classList.remove("scale-100");
  setCurrentEditingClipIndex(-1);
}

function saveEditedClipName() {
  if (currentEditingClipIndex === -1) return;

  const newName = editClipNameInput.value.trim();
  if (!newName) {
    showNotification("Clip name cannot be empty");
    return;
  }

  const newClips = [...clips];
  newClips[currentEditingClipIndex].name = newName;
  setClips(newClips);

  renderClips();
  closeEditClipNameModal();
  saveToLocalStorage();

  showNotification("Clip name updated");
}

function exportClips() {
  if (clips.length === 0) {
    showNotification("No clips to export");
    return;
  }

  const exportData = clips.map((clip) => ({
    name: clip.name,
    inicio: clip.inicio,
    fin: clip.fin,
    duration: clip.duration,
    totalSeconds: clip.totalSeconds || 0,
    transcriptions: clip.transcriptions.map((t) => ({
      inicio: t.inicio,
      fin: t.fin,
      transcripcion: t.transcripcion,
    })),
  }));

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "clips.json";
  a.click();

  URL.revokeObjectURL(url);

  showNotification("Clips exported as JSON");
}

function exportMarkdown() {
  if (clips.length === 0) {
    showNotification("No clips to export");
    return;
  }

  let mdContent = "# Exported Clips\n\n";

  clips.forEach((clip) => {
    mdContent += `# Clip: ${clip.name}\n`;
    mdContent += `## Info\n`;
    mdContent += `- Start: ${clip.inicio}\n`;
    mdContent += `- End: ${clip.fin}\n`;
    mdContent += `- Duration: ${clip.duration}\n\n`;

    mdContent += `## Lines\n`;

    const sortedTranscriptions = [...clip.transcriptions].sort((a, b) => a.index - b.index);

    sortedTranscriptions.forEach((t) => {
      mdContent += `${t.inicio} ${t.fin} ${t.transcripcion}\n`;
    });

    mdContent += "\n\n";
  });

  const blob = new Blob([mdContent], {
    type: "text/markdown",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "clips.md";
  a.click();

  URL.revokeObjectURL(url);

  showNotification("Clips exported as Markdown");
}

function exportEDLFile() {
  if (clips.length === 0) {
    showNotification("No clips to export");
    return;
  }

  const result = exportEDL(clips);

  if (result) {
    showNotification("Clips exported as EDL");
  } else {
    showNotification("Error exporting clips as EDL");
  }
}

export function updateClipCount() {
  clipCount.textContent = clips.length;
}

function updateSelectedTable() {
  selectedTranscriptionsTable.innerHTML = "";
  selectedCount.textContent = `${selectedTranscriptions.length} lines`;

  if (selectedTranscriptions.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="4" class="px-5 py-8 text-sm text-center text-gray-500">
        <div class="flex flex-col items-center gap-2 opacity-50">
          <i data-lucide="mouse-pointer-2" class="w-5 h-5"></i>
          <span>Select lines from the table above</span>
        </div>
      </td>
    `;
    selectedTranscriptionsTable.appendChild(emptyRow);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const sortedTranscriptions = [...selectedTranscriptions].sort((a, b) => a.index - b.index);

  const fragment = document.createDocumentFragment();

  sortedTranscriptions.forEach((item, i) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-dark-50 transition-colors border-b border-dark-50/30";

    row.innerHTML = `
      <td class="px-4 py-2 text-xs font-mono text-gray-400">${item.inicio}</td>
      <td class="px-4 py-2 text-xs font-mono text-gray-400">${item.fin}</td>
      <td class="px-4 py-2 text-sm leading-relaxed">${item.transcripcion}</td>
      <td class="px-4 py-2 text-sm text-right">
        <button class="remove-selected-btn px-2 py-1 bg-dark-100 hover:bg-dark-50 rounded text-xs font-medium transition-colors text-gray-400 hover:text-red-400 border border-dark-50" data-index="${i}">
          Remove
        </button>
      </td>
    `;

    fragment.appendChild(row);
  });

  selectedTranscriptionsTable.appendChild(fragment);

  if (window.lucide) window.lucide.createIcons();

  if (!selectedTranscriptionsTable.hasEventListener) {
    selectedTranscriptionsTable.addEventListener("click", function (e) {
      const removeBtn = e.target.closest(".remove-selected-btn");
      if (removeBtn) {
        const index = parseInt(removeBtn.dataset.index);
        removeSelectedTranscription(index);
      }
    });
    selectedTranscriptionsTable.hasEventListener = true;
  }
}

function removeSelectedTranscription(index) {
  const realIndex = selectedTranscriptions[index]?.index;

  const newSelected = [...selectedTranscriptions];
  newSelected.splice(index, 1);
  setSelectedTranscriptions(newSelected);

  if (realIndex !== undefined) {
    updateSingleRow(realIndex);
  }

  updateSelectedTable();
  saveToLocalStorage();
}

function clearTranscriptions() {
  setTranscriptions([]);
  setSelectedTranscriptions([]);
  setClips([]);
  setLastSelectedIndex(-1);
  renderTable();
  updateSelectedTable();
  renderClips();
  updateClipCount();
  updateStatus();
  saveToLocalStorage();
  toggleImportButton();
  showNotification("All data cleared successfully");
}