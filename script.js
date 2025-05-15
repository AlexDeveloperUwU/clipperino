const editorTabBtn = document.getElementById("editorTabBtn");
const viewerTabBtn = document.getElementById("viewerTabBtn");
const editorTab = document.getElementById("editorTab");
const viewerTab = document.getElementById("viewerTab");

const csvFileInput = document.getElementById("csvFileInput");
const transcriptionsTable = document.getElementById("transcriptionsTable");
const clipList = document.getElementById("clipList");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportMarkdownBtn = document.getElementById("exportMarkdownBtn");
const status = document.getElementById("status");
const clipCount = document.getElementById("clipCount");
const addClipBtn = document.getElementById("addClipBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const playButton = document.getElementById("playButton");

const nameClipModal = document.getElementById("nameClipModal");
const clipNameInput = document.getElementById("clipName");
const selectedLinesInfo = document.getElementById("selectedLinesInfo");
const cancelClipBtn = document.getElementById("cancelClipBtn");
const saveClipBtn = document.getElementById("saveClipBtn");

const csvFileLabel = document.getElementById("csvFileLabel");
const clearCsvBtn = document.getElementById("clearCsvBtn");
const selectedTranscriptionsTable = document.getElementById("selectedTranscriptionsTable");
const selectedCount = document.getElementById("selectedCount");

const editClipNameModal = document.getElementById("editClipNameModal");
const editClipNameInput = document.getElementById("editClipName");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");

const jsonFileInput = document.getElementById("jsonFileInput");
const jsonClipsList = document.getElementById("jsonClipsList");
const jsonStatus = document.getElementById("jsonStatus");
const jsonInfoPanel = document.getElementById("jsonInfoPanel");
const jsonFileLabel = document.getElementById("jsonFileLabel");
const clearJsonBtn = document.getElementById("clearJsonBtn");

const editorTabActions = document.getElementById("editorTabActions");
const viewerTabActions = document.getElementById("viewerTabActions");

let transcriptions = [];
let clips = [];
let selectedTranscriptions = [];
let jsonClips = [];
let isPlaying = false;
let currentEditingClipIndex = -1;

document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  toggleJsonImportButton();
});

editorTabBtn.addEventListener("click", () => {
  switchTab("editor");
});

viewerTabBtn.addEventListener("click", () => {
  switchTab("viewer");
});

csvFileInput.addEventListener("change", handleFileUpload);
exportJsonBtn.addEventListener("click", exportClips);
exportMarkdownBtn.addEventListener("click", exportMarkdown);
addClipBtn.addEventListener("click", openNameClipModal);
clearAllBtn.addEventListener("click", clearSelectedTranscriptions);
cancelClipBtn.addEventListener("click", closeNameClipModal);
saveClipBtn.addEventListener("click", saveClip);
playButton.addEventListener("click", togglePlay);
clearCsvBtn.addEventListener("click", clearTranscriptions);

cancelEditBtn.addEventListener("click", closeEditClipNameModal);
saveEditBtn.addEventListener("click", saveEditedClipName);

jsonFileInput.addEventListener("change", handleJsonFileUpload);
clearJsonBtn.addEventListener("click", clearJsonData);

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

function switchTab(tabName) {
  if (tabName === "editor") {
    editorTab.classList.remove("hidden");
    viewerTab.classList.add("hidden");
    editorTabBtn.classList.add("border-accent-100", "text-white");
    editorTabBtn.classList.remove("border-transparent", "text-gray-400");
    viewerTabBtn.classList.add("border-transparent", "text-gray-400");
    viewerTabBtn.classList.remove("border-accent-100", "text-white");
    editorTabActions.classList.remove("hidden");
    viewerTabActions.classList.add("hidden");
  } else {
    editorTab.classList.add("hidden");
    viewerTab.classList.remove("hidden");
    viewerTabBtn.classList.add("border-accent-100", "text-white");
    viewerTabBtn.classList.remove("border-transparent", "text-gray-400");
    editorTabBtn.classList.add("border-transparent", "text-gray-400");
    editorTabBtn.classList.remove("border-accent-100", "text-white");
    viewerTabActions.classList.remove("hidden");
    editorTabActions.classList.add("hidden");
  }
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

function parseCSV(data, showLoadNotification = true) {
  const lines = data.split("\n");
  const hasHeader = lines[0].includes("inicio") || lines[0].includes("Inicio");

  if (showLoadNotification && lines.length > 500) {
    showNotification(`Cargando ${lines.length} líneas, por favor espere...`);
  }

  setTimeout(() => {
    processCSVBatches(lines, hasHeader ? 1 : 0, [], showLoadNotification);
  }, 10);
}

function processCSVBatches(lines, currentIndex, results, showLoadNotification = true) {
  const batchSize = 500;
  const endIndex = Math.min(currentIndex + batchSize, lines.length);

  for (let i = currentIndex; i < endIndex; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const parts = line.split(",");
    if (parts.length < 3) continue;

    results.push({
      inicio: parts[0].trim(),
      fin: parts[1].trim(),
      transcripcion: parts.slice(2).join(",").trim().replace(/^"|"$/g, ""),
    });
  }

  if (showLoadNotification && lines.length > 1000 && endIndex < lines.length) {
    const progress = Math.round((endIndex / lines.length) * 100);
    showNotification(`Procesando: ${progress}% completado...`);
  }

  if (endIndex < lines.length) {
    setTimeout(() => {
      processCSVBatches(lines, endIndex, results, showLoadNotification);
    }, 0);
  } else {
    transcriptions = results;
    renderTable();
    updateStatus();
    saveToLocalStorage();

    if (showLoadNotification && lines.length > 500) {
      showNotification(`${transcriptions.length} transcripciones cargadas correctamente`);
    }
  }
}

function renderTable() {
  transcriptionsTable.innerHTML = "";

  const totalRows = transcriptions.length;
  const batchSize = 50;

  const fragment = document.createDocumentFragment();

  const visibleRows = Math.min(totalRows, batchSize);

  for (let i = 0; i < visibleRows; i++) {
    const item = transcriptions[i];
    const row = document.createElement("tr");
    row.className = "hover:bg-dark-100 transition-colors";
    row.dataset.index = i;

    const isSelected = selectedTranscriptions.some((t) => t.index === i);
    if (isSelected) {
      row.classList.add("bg-accent-100/10");
    }

    row.innerHTML = `
                    <td class="px-5 py-3 text-sm">${item.inicio}</td>
                    <td class="px-5 py-3 text-sm">${item.fin}</td>
                    <td class="px-5 py-3 text-sm">${item.transcripcion}</td>
                    <td class="px-5 py-3 text-sm text-right">
                        <button class="select-btn px-3 py-1 ${
                          isSelected ? "bg-accent-100" : "bg-dark-100 hover:bg-dark-50"
                        } rounded text-xs font-medium transition-colors">
                            ${isSelected ? "Seleccionado" : "Seleccionar"}
                        </button>
                    </td>
                `;

    fragment.appendChild(row);
  }

  transcriptionsTable.appendChild(fragment);

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

  if (!transcriptionsTable.hasEventListener) {
    transcriptionsTable.addEventListener("click", function (e) {
      const selectBtn = e.target.closest(".select-btn");
      if (selectBtn) {
        const row = selectBtn.closest("tr");
        const index = parseInt(row.dataset.index);
        selectTranscription(index);
      }
    });
    transcriptionsTable.hasEventListener = true;
  }

  updateSelectedTable();
}

function loadMoreRows(startIndex) {
  const batchSize = 30;
  const endIndex = Math.min(startIndex + batchSize, transcriptions.length);

  const fragment = document.createDocumentFragment();

  for (let i = startIndex; i < endIndex; i++) {
    const item = transcriptions[i];
    const row = document.createElement("tr");
    row.className = "hover:bg-dark-100 transition-colors";
    row.dataset.index = i;

    const isSelected = selectedTranscriptions.some((t) => t.index === i);
    if (isSelected) {
      row.classList.add("bg-accent-100/10");
    }

    row.innerHTML = `
                    <td class="px-5 py-3 text-sm">${item.inicio}</td>
                    <td class="px-5 py-3 text-sm">${item.fin}</td>
                    <td class="px-5 py-3 text-sm">${item.transcripcion}</td>
                    <td class="px-5 py-3 text-sm text-right">
                        <button class="select-btn px-3 py-1 ${
                          isSelected ? "bg-accent-100" : "bg-dark-100 hover:bg-dark-50"
                        } rounded text-xs font-medium transition-colors">
                            ${isSelected ? "Seleccionado" : "Seleccionar"}
                        </button>
                    </td>
                `;

    fragment.appendChild(row);
  }

  transcriptionsTable.appendChild(fragment);
}

function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

function selectTranscription(index) {
  const transcription = transcriptions[index];
  const existingIndex = selectedTranscriptions.findIndex((t) => t.index === index);

  if (existingIndex !== -1) {
    selectedTranscriptions.splice(existingIndex, 1);
  } else {
    selectedTranscriptions.push({
      ...transcription,
      index,
    });
  }

  renderTable();
  updateSelectedTable();
  saveToLocalStorage();
}

function clearSelectedTranscriptions() {
  selectedTranscriptions = [];
  renderTable();
  updateSelectedTable();
  saveToLocalStorage();
}

function updateStatus() {
  status.textContent = `${transcriptions.length} transcripciones cargadas`;
  toggleImportButton();
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

  const newClip = {
    name: clipName,
    inicio: sortedTranscriptions[0].inicio,
    fin: sortedTranscriptions[sortedTranscriptions.length - 1].fin,
    duration: calculateDuration(
      sortedTranscriptions[0].inicio,
      sortedTranscriptions[sortedTranscriptions.length - 1].fin
    ),
    lines: sortedTranscriptions.length,
    transcriptions: sortedTranscriptions,
    timestamp: new Date().toISOString(),
  };

  clips.push(newClip);
  renderClips();
  closeNameClipModal();
  updateClipCount();
  clearSelectedTranscriptions();
  saveToLocalStorage();

  showNotification("Clip guardado correctamente");
}

function calculateDuration(start, end) {
  try {
    const [startMin, startSec] = start.split(":").map(Number);
    const [endMin, endSec] = end.split(":").map(Number);

    const startTotalSec = startMin * 60 + startSec;
    const endTotalSec = endMin * 60 + endSec;
    const durationSec = endTotalSec - startTotalSec;

    if (durationSec <= 0) return "00:00";

    const durationMin = Math.floor(durationSec / 60);
    const remainingSec = durationSec % 60;

    return `${durationMin.toString().padStart(2, "0")}:${remainingSec.toString().padStart(2, "0")}`;
  } catch (e) {
    return "00:00";
  }
}

function renderClips() {
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
}

function removeClip(index) {
  clips.splice(index, 1);
  renderClips();
  updateClipCount();
  saveToLocalStorage();
}

function openEditClipNameModal(index) {
  currentEditingClipIndex = index;
  const clip = clips[index];

  editClipNameInput.value = clip.name;
  editClipNameModal.classList.add("opacity-100", "pointer-events-auto");

  setTimeout(() => editClipNameInput.focus(), 100);
}

function closeEditClipNameModal() {
  editClipNameModal.classList.remove("opacity-100", "pointer-events-auto");
  currentEditingClipIndex = -1;
}

function saveEditedClipName() {
  if (currentEditingClipIndex === -1) return;

  const newName = editClipNameInput.value.trim();
  if (!newName) {
    showNotification("El nombre del clip no puede estar vacío");
    return;
  }

  clips[currentEditingClipIndex].name = newName;
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

function updateClipCount() {
  clipCount.textContent = clips.length;
}

function togglePlay() {
  isPlaying = !isPlaying;
  playButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function saveToLocalStorage() {
  try {
    localStorage.setItem("clipperino_transcriptions", JSON.stringify(transcriptions));
    localStorage.setItem("clipperino_clips", JSON.stringify(clips));
    localStorage.setItem("clipperino_selected", JSON.stringify(selectedTranscriptions));
  } catch (e) {
    console.error("Error saving to localStorage:", e);
  }
}

function loadFromLocalStorage() {
  try {
    const savedTranscriptions = localStorage.getItem("clipperino_transcriptions");
    const savedClips = localStorage.getItem("clipperino_clips");
    const savedSelected = localStorage.getItem("clipperino_selected");
    const savedJsonClips = localStorage.getItem("clipperino_json_clips");

    if (savedTranscriptions) {
      transcriptions = JSON.parse(savedTranscriptions);
      renderTable();
      updateStatus();
    }

    if (savedClips) {
      clips = JSON.parse(savedClips);
      renderClips();
      updateClipCount();
    }

    if (savedSelected) {
      selectedTranscriptions = JSON.parse(savedSelected);
      renderTable();
      updateSelectedTable();
    }

    if (savedJsonClips) {
      jsonClips = JSON.parse(savedJsonClips);
      renderJsonClips(jsonClips, false);
      updateJsonInfo();
      toggleJsonImportButton();
    }
  } catch (e) {
    console.error("Error loading from localStorage:", e);
  }
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className =
    "fixed bottom-4 right-4 bg-dark-50 text-white px-4 py-3 rounded-lg shadow-lg z-50 fade-in flex items-center";
  notification.innerHTML = `
                <i class="fas fa-info-circle mr-2 text-accent-100"></i>
                <span>${message}</span>
            `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(10px)";
    notification.style.transition = "opacity 0.3s, transform 0.3s";

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
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
  selectedTranscriptions.splice(index, 1);
  renderTable();
  updateSelectedTable();
  saveToLocalStorage();
}

function clearTranscriptions() {
  transcriptions = [];
  selectedTranscriptions = [];
  renderTable();
  updateSelectedTable();
  updateStatus();
  saveToLocalStorage();
  toggleImportButton();
  showNotification("Datos eliminados correctamente");
}

function toggleImportButton() {
  if (transcriptions.length > 0) {
    csvFileLabel.classList.add("hidden");
    clearCsvBtn.classList.remove("hidden");
  } else {
    csvFileLabel.classList.remove("hidden");
    clearCsvBtn.classList.add("hidden");
  }
}

function handleJsonFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        jsonClips = jsonData;
        renderJsonClips(jsonClips, true);
        updateJsonInfo();
        saveJsonToLocalStorage();
        toggleJsonImportButton();
      } catch (error) {
        showNotification("Error al procesar el archivo JSON");
        console.error("Error parsing JSON:", error);
      }
    };
    reader.readAsText(file);
  }
}

function renderJsonClips(jsonData, showLoadNotification = true) {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    jsonClipsList.innerHTML =
      '<p class="text-gray-400 text-center py-8">No se encontraron clips en el archivo JSON</p>';
    jsonStatus.textContent = "0 clips cargados";
    return;
  }

  jsonStatus.textContent = `${jsonData.length} clips cargados`;
  jsonClipsList.innerHTML = "";

  jsonData.forEach((clip, index) => {
    const clipDiv = document.createElement("div");
    clipDiv.className =
      "clip-item bg-dark-100 rounded-lg p-4 mb-3 relative hover:bg-dark-50 transition-colors cursor-pointer";
    clipDiv.dataset.index = index;

    clipDiv.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-medium text-white">${clip.name}</h3>
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
            <div class="text-xs text-gray-400">${clip.transcriptions.length} líneas</div>
        `;

    clipDiv.addEventListener("click", () => {
      showClipDetails(index);

      const allClips = jsonClipsList.querySelectorAll(".clip-item");
      allClips.forEach((c) => c.classList.remove("bg-accent-100/10"));
      clipDiv.classList.add("bg-accent-100/10");
    });

    jsonClipsList.appendChild(clipDiv);
  });

  if (jsonData.length > 0) {
    showClipDetails(0);
    const firstClip = jsonClipsList.querySelector(".clip-item");
    if (firstClip) {
      firstClip.classList.add("bg-accent-100/10");
    }
  }

  if (showLoadNotification) {
    showNotification(`${jsonData.length} clips cargados correctamente`);
  }
}

function showClipDetails(index) {
  const clip = jsonClips[index];
  if (!clip) return;

  const clipDetailStatus = document.getElementById("clipDetailStatus");
  clipDetailStatus.textContent = `${clip.transcriptions.length} líneas | ${clip.duration} duración`;

  jsonInfoPanel.innerHTML = "";

  const clipHeader = document.createElement("div");
  clipHeader.className = "px-5 py-3 bg-dark-100 border-b border-dark-50";
  clipHeader.innerHTML = `
        <h3 class="text-lg font-semibold text-white">${clip.name}</h3>
        <div class="flex flex-wrap gap-2 mt-2">
            <span class="bg-dark-50 text-xs px-2 py-1 rounded-md text-gray-300">
                <i class="fas fa-play-circle mr-1 opacity-70"></i> ${clip.inicio}
            </span>
            <span class="bg-dark-50 text-xs px-2 py-1 rounded-md text-gray-300">
                <i class="fas fa-stop-circle mr-1 opacity-70"></i> ${clip.fin}
            </span>
        </div>
    `;

  const table = document.createElement("table");
  table.className = "w-full";

  const thead = document.createElement("thead");
  thead.innerHTML = `
        <tr class="text-left bg-dark-100">
            <th class="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Inicio</th>
            <th class="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Fin</th>
            <th class="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Transcripción</th>
        </tr>
    `;

  const tbody = document.createElement("tbody");
  tbody.className = "divide-y divide-dark-50";

  const sortedTranscriptions = [...clip.transcriptions];
  if (sortedTranscriptions.length > 0 && "index" in sortedTranscriptions[0]) {
    sortedTranscriptions.sort((a, b) => a.index - b.index);
  }

  sortedTranscriptions.forEach((t, i) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-dark-50 transition-colors";
    row.innerHTML = `
            <td class="px-5 py-3 text-sm">${t.inicio}</td>
            <td class="px-5 py-3 text-sm">${t.fin}</td>
            <td class="px-5 py-3 text-sm">${t.transcripcion}</td>
        `;
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  jsonInfoPanel.appendChild(clipHeader);
  jsonInfoPanel.appendChild(table);
}

function updateJsonInfo() {
  if (jsonClips.length > 0) {
    let totalDuration = 0;
    let totalLines = 0;

    jsonClips.forEach((clip) => {
      totalLines += clip.transcriptions.length;

      try {
        const [min, sec] = clip.duration.split(":").map(Number);
        totalDuration += min * 60 + sec;
      } catch (e) {}
    });

    const durationMin = Math.floor(totalDuration / 60);
    const durationSec = totalDuration % 60;
    const formattedDuration = `${durationMin.toString().padStart(2, "0")}:${durationSec.toString().padStart(2, "0")}`;

    jsonStatus.textContent = `${jsonClips.length} clips | ${totalLines} líneas | ${formattedDuration} duración total`;
  } else {
    jsonStatus.textContent = "0 clips cargados";
  }
}

function saveJsonToLocalStorage() {
  try {
    localStorage.setItem("clipperino_json_clips", JSON.stringify(jsonClips));
  } catch (e) {
    console.error("Error saving JSON to localStorage:", e);
  }
}

function clearJsonData() {
  jsonClips = [];
  jsonClipsList.innerHTML =
    '<p class="text-gray-400 text-center py-8">Selecciona un archivo JSON para visualizar los clips</p>';
  jsonInfoPanel.innerHTML =
    '<p class="text-gray-400 text-center py-6">Carga un archivo JSON para ver la información</p>';
  jsonStatus.textContent = "0 clips cargados";
  saveJsonToLocalStorage();
  toggleJsonImportButton();
  showNotification("Datos JSON eliminados correctamente");
}

function toggleJsonImportButton() {
  if (jsonClips.length > 0) {
    jsonFileLabel.classList.add("hidden");
    clearJsonBtn.classList.remove("hidden");
  } else {
    jsonFileLabel.classList.remove("hidden");
    clearJsonBtn.classList.add("hidden");
  }
}
