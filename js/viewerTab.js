import { jsonFileInput, jsonClipsList, jsonStatus, jsonInfoPanel, jsonFileLabel, clearJsonBtn } from "./elements.js";
import { jsonClips, setJsonClips } from "./state.js";
import { showNotification } from "./ui.js";

export function initViewerTab() {
  jsonFileInput.addEventListener("change", handleJsonFileUpload);
  clearJsonBtn.addEventListener("click", clearJsonData);
}

function handleJsonFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        setJsonClips(jsonData);
        renderJsonClips(jsonData, true);
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

export function renderJsonClips(jsonData, showLoadNotification = true) {
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
  setJsonClips([]);
  jsonClipsList.innerHTML =
    '<p class="text-gray-400 text-center py-8">Selecciona un archivo JSON para visualizar los clips</p>';
  jsonInfoPanel.innerHTML =
    '<p class="text-gray-400 text-center py-6">Carga un archivo JSON para ver la información</p>';
  jsonStatus.textContent = "0 clips cargados";
  saveJsonToLocalStorage();
  toggleJsonImportButton();
  showNotification("Datos JSON eliminados correctamente");
}

export function toggleJsonImportButton() {
  if (jsonClips.length > 0) {
    jsonFileLabel.classList.add("hidden");
    clearJsonBtn.classList.remove("hidden");
  } else {
    jsonFileLabel.classList.remove("hidden");
    clearJsonBtn.classList.add("hidden");
  }
}
