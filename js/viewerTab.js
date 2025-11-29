import {
  jsonFileInput,
  jsonClipsList,
  jsonStatus,
  jsonInfoPanel,
  jsonFileLabel,
  clearJsonBtn,
  viewerTab,
  viewerDragOverlay,
  viewerTabBtn,
  viewerClipsHeader,
  viewerHeaderIcon
} from "./elements.js";
import { jsonClips, setJsonClips, clips } from "./state.js";
import { showNotification } from "./ui.js";

export function initViewerTab() {
  jsonFileInput.addEventListener("change", handleJsonFileUpload);
  clearJsonBtn.addEventListener("click", clearJsonData);
  viewerTabBtn.addEventListener("click", () => renderViewer());
  initDragAndDrop();
}

function initDragAndDrop() {
  if (!viewerTab) return;

  let dragCounter = 0;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    viewerTab.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  viewerTab.addEventListener('dragenter', (e) => {
    dragCounter++;
    showDragOverlay();
  }, false);

  viewerTab.addEventListener('dragleave', (e) => {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      hideDragOverlay();
    }
  }, false);

  viewerTab.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    dragCounter = 0;
    hideDragOverlay();

    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target.result);
            setJsonClips(jsonData);
            renderViewer(jsonData, true);
            saveJsonToLocalStorage();
          } catch (error) {
            showNotification("Error processing JSON file");
            console.error("Error parsing JSON:", error);
          }
        };
        reader.readAsText(file);
      } else {
        showNotification("Invalid file type. Please drop a JSON file.");
      }
    }
  }

  function showDragOverlay() {
    if (viewerDragOverlay) {
      viewerDragOverlay.classList.remove("opacity-0", "scale-95");
      viewerDragOverlay.classList.add("opacity-100", "scale-100");
    }
  }

  function hideDragOverlay() {
    if (viewerDragOverlay) {
      viewerDragOverlay.classList.remove("opacity-100", "scale-100");
      viewerDragOverlay.classList.add("opacity-0", "scale-95");
    }
  }
}

function handleJsonFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        setJsonClips(jsonData);
        renderViewer(jsonData, true);
        saveJsonToLocalStorage();
      } catch (error) {
        showNotification("Error processing JSON file");
        console.error("Error parsing JSON:", error);
      }
    };
    reader.readAsText(file);
  }
}

export function renderViewer(data = null, showLoadNotification = false) {
  let clipsToRender = [];
  let source = "";

  if (data) {
    clipsToRender = data;
    source = "json";
  } else if (jsonClips.length > 0) {
    clipsToRender = jsonClips;
    source = "json";
  } else if (clips.length > 0) {
    clipsToRender = clips;
    source = "editor";
  }

  if (viewerClipsHeader && viewerHeaderIcon) {
    if (source === "json") {
      viewerClipsHeader.innerHTML = `<i data-lucide="download" class="text-gray-500 w-4 h-4"></i> Imported Clips`;
      jsonFileLabel.classList.add("hidden");
      clearJsonBtn.classList.remove("hidden");
    } else if (source === "editor") {
      viewerClipsHeader.innerHTML = `<i data-lucide="clapperboard" class="text-gray-500 w-4 h-4"></i> Created Clips`;
      jsonFileLabel.classList.remove("hidden");
      clearJsonBtn.classList.add("hidden");
    } else {
      viewerClipsHeader.innerHTML = `<i data-lucide="download" class="text-gray-500 w-4 h-4"></i> Clips`;
      jsonFileLabel.classList.remove("hidden");
      clearJsonBtn.classList.add("hidden");
    }
  }

  if (clipsToRender.length === 0) {
    jsonClipsList.innerHTML =
      '<p class="text-xs text-gray-500 text-center py-10 flex flex-col gap-2 items-center"><i data-lucide="film" class="w-8 h-8 opacity-20"></i><span>No clips found</span></p>';
    jsonStatus.textContent = "0 loaded";
    jsonInfoPanel.innerHTML =
      '<div class="flex flex-col items-center justify-center h-full text-gray-500"><p class="text-sm">Load a JSON file or create clips to view details</p></div>';

    if (window.lucide) window.lucide.createIcons();
    return;
  }

  jsonStatus.textContent = `${clipsToRender.length} clips loaded`;
  jsonClipsList.innerHTML = "";

  clipsToRender.forEach((clip, index) => {
    const clipDiv = document.createElement("div");
    clipDiv.className =
      "clip-item bg-dark-200 border border-dark-50 rounded p-3 relative hover:border-dark-50/80 transition-all cursor-pointer mb-2";
    clipDiv.dataset.index = index;

    clipDiv.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-sm text-white flex items-center gap-2 truncate pr-2">
          <span class="truncate">${clip.name}</span>
        </h3>
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
        <span>${clip.transcriptions.length} lines</span>
        <span class="opacity-50">#${index + 1}</span>
      </div>
    `;

    clipDiv.addEventListener("click", () => {
      showClipDetails(clip);

      const allClips = jsonClipsList.querySelectorAll(".clip-item");
      allClips.forEach((c) => {
        c.classList.remove("border-accent-100", "bg-dark-100");
        c.classList.add("border-dark-50", "bg-dark-200");
      });

      clipDiv.classList.remove("border-dark-50", "bg-dark-200");
      clipDiv.classList.add("border-accent-100", "bg-dark-100");
    });

    jsonClipsList.appendChild(clipDiv);
  });

  if (window.lucide) window.lucide.createIcons();

  if (clipsToRender.length > 0) {
    showClipDetails(clipsToRender[0]);
    updateJsonInfo(clipsToRender);
    const firstClip = jsonClipsList.querySelector(".clip-item");
    if (firstClip) {
      firstClip.classList.remove("border-dark-50", "bg-dark-200");
      firstClip.classList.add("border-accent-100", "bg-dark-100");
    }
  }

  if (showLoadNotification) {
    showNotification(`${clipsToRender.length} clips loaded successfully`);
  }
}

function showClipDetails(clip) {
  if (!clip) return;

  const clipDetailStatus = document.getElementById("clipDetailStatus");
  clipDetailStatus.textContent = `${clip.transcriptions.length} lines | ${clip.duration} duration`;

  jsonInfoPanel.innerHTML = "";

  const tableContainer = document.createElement("div");
  tableContainer.className = "flex-1 overflow-y-auto bg-dark-300 scrollbar-thin";

  const table = document.createElement("table");
  table.className = "w-full border-collapse";

  const thead = document.createElement("thead");
  thead.className = "sticky top-0 z-10 bg-dark-100 shadow-sm";
  thead.innerHTML = `
    <tr class="text-left">
      <th class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Start</th>
      <th class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">End</th>
      <th class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Transcript</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");
  tbody.className = "divide-y divide-dark-50";

  const sortedTranscriptions = [...clip.transcriptions];
  if (sortedTranscriptions.length > 0 && "index" in sortedTranscriptions[0]) {
    sortedTranscriptions.sort((a, b) => a.index - b.index);
  }

  sortedTranscriptions.forEach((t) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-dark-100 transition-colors border-b border-dark-50/30";
    row.innerHTML = `
      <td class="px-4 py-2 text-xs font-mono text-gray-400">${t.inicio}</td>
      <td class="px-4 py-2 text-xs font-mono text-gray-400">${t.fin}</td>
      <td class="px-4 py-2 text-sm leading-relaxed">${t.transcripcion}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableContainer.appendChild(table);

  jsonInfoPanel.appendChild(tableContainer);

  if (window.lucide) window.lucide.createIcons();
}

function updateJsonInfo(currentClips) {
  if (currentClips && currentClips.length > 0) {
    let totalDuration = 0;
    let totalLines = 0;

    currentClips.forEach((clip) => {
      totalLines += clip.transcriptions.length;

      if (clip.totalSeconds) {
        totalDuration += clip.totalSeconds;
      } else {
        try {
          const [min, sec] = clip.duration.split(":").map(Number);
          totalDuration += min * 60 + sec;
        } catch (e) { }
      }
    });

    const durationHour = Math.floor(totalDuration / 3600);
    const durationMin = Math.floor((totalDuration % 3600) / 60);
    const durationSec = totalDuration % 60;
    const formattedDuration = `${durationHour.toString().padStart(2, "0")}:${durationMin
      .toString()
      .padStart(2, "0")}:${durationSec.toString().padStart(2, "0")}`;

    jsonStatus.textContent = `${currentClips.length} clips | ${totalLines} lines | ${formattedDuration} total duration`;
  } else {
    jsonStatus.textContent = "0 clips loaded";
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
  renderViewer();
  saveJsonToLocalStorage();
  if (window.lucide) window.lucide.createIcons();
  showNotification("JSON data cleared");
}
