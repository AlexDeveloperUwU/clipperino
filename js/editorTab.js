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
  // Asegurarse de que todas las funciones estén definidas antes de usarlas
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

// Mejorada para garantizar que siempre pueda navegar correctamente
export function navigateToLine(lineIndex) {
  if (lineIndex < 0 || transcriptions.length === 0) return;

  console.log(`Intentando navegar a línea ${lineIndex} de ${transcriptions.length} líneas`);

  // Asegurar que el índice no exceda el número de transcripciones
  const targetIndex = Math.min(lineIndex, transcriptions.length - 1);

  // Necesitamos cargar suficientes filas para que la fila objetivo sea visible
  transcriptionsTable.innerHTML = "";

  // Calcular cuántos lotes necesitamos para llegar a nuestra fila
  const batchSize = 200;
  const batchesToLoad = Math.floor(targetIndex / batchSize) + 1;

  console.log(`Cargando ${batchesToLoad} lotes para llegar a la línea ${targetIndex}`);

  // Cargar todos los lotes necesarios
  for (let i = 0; i < batchesToLoad; i++) {
    loadBatch(i * batchSize, batchSize);
  }

  // Esperar a que el DOM se actualice antes de intentar desplazarse
  setTimeout(() => {
    const targetRow = document.querySelector(`tr[data-index="${targetIndex}"]`);
    if (targetRow) {
      console.log("Fila encontrada, desplazando...");

      // Asegurarnos de que la tabla tenga suficiente altura para desplazarse
      const tableContainer = transcriptionsTable.closest(".overflow-y-auto");
      if (tableContainer) {
        // Usar scrollIntoView con opciones básicas para mayor compatibilidad
        targetRow.scrollIntoView();
      }

      // Resaltar la fila para que sea fácil de ver
      targetRow.classList.add("highlight-row");
      setTimeout(() => targetRow.classList.remove("highlight-row"), 2000);
    } else {
      console.warn(`No se encontró la fila objetivo con índice ${targetIndex}`);
    }
  }, 100);
}

// Modificada para usar la función navigateToLine mejorada
export function renderTable(scrollToIndex = -1) {
  transcriptionsTable.innerHTML = "";

  if (scrollToIndex > -1) {
    return navigateToLine(scrollToIndex);
  }

  const totalRows = transcriptions.length;
  const batchSize = 200;

  loadBatch(0, batchSize);

  const tableContainer = transcriptionsTable.closest(".overflow-y-auto");
  if (tableContainer) {
    tableContainer.onscroll = debounce(function () {
      const lastRow = transcriptionsTable.lastElementChild;
      if (!lastRow) return;

      const lastRowIndex = parseInt(lastRow.dataset.index);

      if (
        tableContainer.scrollTop + tableContainer.clientHeight > tableContainer.scrollHeight - 200 &&
        lastRowIndex < totalRows - 1
      ) {
        loadMoreRows(lastRowIndex + 1);
      }
    }, 100);
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
    row.className = "hover:bg-dark-100 transition-colors";
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
      <td class="px-5 py-3 text-sm">${item.inicio}</td>
      <td class="px-5 py-3 text-sm">${item.fin}</td>
      <td class="px-5 py-3 text-sm">${item.transcripcion}</td>
      <td class="px-5 py-3 text-sm text-right">
        ${
          isInClip
            ? '<span class="text-xs text-gray-500 with-clip-icon">En uso</span>'
            : `<button class="select-btn px-3 py-1 ${
                isSelected ? "bg-accent-100" : "bg-dark-100 hover:bg-dark-50"
              } rounded text-xs font-medium transition-colors">
            ${isSelected ? "Seleccionado" : "Seleccionar"}
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
    row.className = "hover:bg-dark-100 transition-colors";
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
      <td class="px-5 py-3 text-sm">${item.inicio}</td>
      <td class="px-5 py-3 text-sm">${item.fin}</td>
      <td class="px-5 py-3 text-sm">${item.transcripcion}</td>
      <td class="px-5 py-3 text-sm text-right">
        ${
          isInClip
            ? '<span class="text-xs text-gray-500 with-clip-icon">En uso</span>'
            : `<button class="select-btn px-3 py-1 ${
                isSelected ? "bg-accent-100" : "bg-dark-100 hover:bg-dark-50"
              } rounded text-xs font-medium transition-colors">
              ${isSelected ? "Seleccionado" : "Seleccionar"}
            </button>`
        }
      </td>
    `;

    fragment.appendChild(row);
  }

  transcriptionsTable.appendChild(fragment);
  updateSearchAfterRowsLoaded();
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
    showNotification(`Se seleccionaron ${addedCount} líneas`);
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
      selectBtn.classList.remove("bg-dark-100", "hover:bg-dark-50");
      selectBtn.classList.add("bg-accent-100");
      selectBtn.textContent = "Seleccionado";
    } else {
      selectBtn.classList.remove("bg-accent-100");
      selectBtn.classList.add("bg-dark-100", "hover:bg-dark-50");
      selectBtn.textContent = "Seleccionar";
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

  // Guardar la última línea vista
  localStorage.setItem("clipperino_last_viewed_line", index.toString());
  console.log("Última línea vista guardada:", index);

  updateSingleRow(index);
  updateSelectedTable();
  saveToLocalStorage();
}

function clearSelectedTranscriptions() {
  const selectedIndices = selectedTranscriptions.map((t) => t.index);

  setSelectedTranscriptions([]);
  setLastSelectedIndex(-1);

  renderTable();
  updateSelectedTable();
  saveToLocalStorage();
}

export function updateStatus() {
  status.textContent = `${transcriptions.length} transcripciones cargadas`;
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
    showNotification("Selecciona al menos una transcripción para crear un clip");
    return;
  }

  nameClipModal.classList.add("opacity-100", "pointer-events-auto");
  clipNameInput.value = "";
  selectedLinesInfo.textContent = `Has seleccionado ${selectedTranscriptions.length} líneas para este clip.`;

  setTimeout(() => clipNameInput.focus(), 100);
}

function closeNameClipModal() {
  nameClipModal.classList.remove("opacity-100", "pointer-events-auto");
}

function saveClip() {
  const clipName = clipNameInput.value.trim() || "Clip sin nombre";

  if (selectedTranscriptions.length === 0) {
    showNotification("Selecciona al menos una transcripción para crear un clip");
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

  showNotification("Clip guardado correctamente");
}

export function renderClips() {
  clipList.innerHTML = "";

  if (clips.length === 0) {
    clipList.innerHTML = '<p class="text-sm text-gray-400 text-center py-6">No hay clips seleccionados</p>';
    return;
  }

  clips.forEach((clip, index) => {
    const clipDiv = document.createElement("div");
    clipDiv.className = "clip-item bg-dark-100 rounded-lg p-4 mb-3 relative";

    clipDiv.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-medium text-white flex items-center gap-2">
          ${clip.name}
          <button class="edit-clip-name-btn text-gray-400 hover:text-accent-100 transition-colors" data-index="${index}">
            <i class="fas fa-edit text-xs"></i>
          </button>
        </h3>
        <button class="remove-clip-btn text-gray-500 hover:text-red-400 transition-colors">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="flex flex-wrap gap-2 mb-2">
        <span class="bg-dark-50 text-xs px-2 py-1 rounded-md text-gray-300">
          <i class="fas fa-play-circle mr-1 opacity-70"></i> ${clip.inicio}
        </span>
        <span class="bg-dark-50 text-xs px-2 py-1 rounded-md text-gray-300">
          <i class="fas fa-stop-circle mr-1 opacity-70"></i> ${clip.fin}
        </span>
        <span class="bg-dark-50 text-xs px-2 py-1 rounded-md text-gray-300">
          <i class="fas fa-clock mr-1 opacity-70"></i> ${clip.duration}
        </span>
      </div>
      <div class="text-xs text-gray-400">${clip.lines} líneas</div>
    `;

    const removeBtn = clipDiv.querySelector(".remove-clip-btn");
    removeBtn.addEventListener("click", () => removeClip(index));

    const editNameBtn = clipDiv.querySelector(".edit-clip-name-btn");
    editNameBtn.addEventListener("click", () => openEditClipNameModal(index));

    clipList.appendChild(clipDiv);
  });

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

  setTimeout(() => editClipNameInput.focus(), 100);
}

function closeEditClipNameModal() {
  editClipNameModal.classList.remove("opacity-100", "pointer-events-auto");
  setCurrentEditingClipIndex(-1);
}

function saveEditedClipName() {
  if (currentEditingClipIndex === -1) return;

  const newName = editClipNameInput.value.trim();
  if (!newName) {
    showNotification("El nombre del clip no puede estar vacío");
    return;
  }

  const newClips = [...clips];
  newClips[currentEditingClipIndex].name = newName;
  setClips(newClips);

  renderClips();
  closeEditClipNameModal();
  saveToLocalStorage();

  showNotification("Nombre del clip actualizado");
}

function exportClips() {
  if (clips.length === 0) {
    showNotification("No hay clips para exportar");
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

  showNotification("Clips exportados en formato JSON");
}

function exportMarkdown() {
  if (clips.length === 0) {
    showNotification("No hay clips para exportar");
    return;
  }

  let mdContent = "# Clips exportados\n\n";

  clips.forEach((clip) => {
    mdContent += `# Clip: ${clip.name}\n`;
    mdContent += `## Información\n`;
    mdContent += `- Inicio: ${clip.inicio}\n`;
    mdContent += `- Fin: ${clip.fin}\n`;
    mdContent += `- Duración: ${clip.duration}\n\n`;

    mdContent += `## Líneas\n`;

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

  showNotification("Clips exportados en formato Markdown");
}

function exportEDLFile() {
  if (clips.length === 0) {
    showNotification("No hay clips para exportar");
    return;
  }

  const result = exportEDL(clips);

  if (result) {
    showNotification("Clips exportados en formato EDL");
  } else {
    showNotification("Error al exportar clips en formato EDL");
  }
}

export function updateClipCount() {
  clipCount.textContent = clips.length;
}

function updateSelectedTable() {
  selectedTranscriptionsTable.innerHTML = "";
  selectedCount.textContent = `${selectedTranscriptions.length} seleccionadas`;

  if (selectedTranscriptions.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="4" class="px-5 py-4 text-sm text-center text-gray-400">
        No hay líneas seleccionadas
      </td>
    `;
    selectedTranscriptionsTable.appendChild(emptyRow);
    return;
  }

  const sortedTranscriptions = [...selectedTranscriptions].sort((a, b) => a.index - b.index);

  const fragment = document.createDocumentFragment();

  sortedTranscriptions.forEach((item, i) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-dark-50 transition-colors bg-secondary-100/5";

    row.innerHTML = `
      <td class="px-5 py-3 text-sm">${item.inicio}</td>
      <td class="px-5 py-3 text-sm">${item.fin}</td>
      <td class="px-5 py-3 text-sm">${item.transcripcion}</td>
      <td class="px-5 py-3 text-sm text-right">
        <button class="remove-selected-btn px-3 py-1 bg-dark-200 hover:bg-dark-50 rounded text-xs font-medium transition-colors text-secondary-100 hover:text-white" data-index="${i}">
          <i class="fas fa-minus-circle"></i> Quitar
        </button>
      </td>
    `;

    fragment.appendChild(row);
  });

  selectedTranscriptionsTable.appendChild(fragment);

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
  showNotification("Todos los datos han sido eliminados correctamente");
}
