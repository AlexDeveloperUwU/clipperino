import { transcriptions, selectedTranscriptions } from "./state.js";
import { debounce, showNotification } from "./ui.js";

let searchResults = [];
let currentSearchTerm = "";
let currentResultIndex = -1;

export function initSearch() {
  const searchInput = document.getElementById("searchInput");

  if (!searchInput) {
    console.error("Elemento de búsqueda no encontrado");
    return;
  }

  addSearchNavButtons();

  searchInput.addEventListener(
    "input",
    debounce(function () {
      const searchTerm = searchInput.value.trim().toLowerCase();
      currentSearchTerm = searchTerm;
      currentResultIndex = -1;

      if (searchTerm.length === 0) {
        clearSearch();
        return;
      }

      performSearch(searchTerm);
    }, 300)
  );

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      searchInput.value = "";
      clearSearch();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        navigateToNextResult();
      }
    }
  });
}

function addSearchNavButtons() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  const searchContainer = searchInput.parentElement;
  if (!searchContainer) return;

  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2";

  const prevButton = document.createElement("button");
  prevButton.className = "text-gray-400 hover:text-white flex items-center justify-center w-6 h-6";
  prevButton.innerHTML = '<i class="fas fa-chevron-up text-xs"></i>';
  prevButton.title = "Resultado anterior";
  prevButton.id = "prevSearchResult";
  prevButton.addEventListener("click", navigateToPrevResult);

  const nextButton = document.createElement("button");
  nextButton.className = "text-gray-400 hover:text-white flex items-center justify-center w-6 h-6";
  nextButton.innerHTML = '<i class="fas fa-chevron-down text-xs"></i>';
  nextButton.title = "Siguiente resultado";
  nextButton.id = "nextSearchResult";
  nextButton.addEventListener("click", navigateToNextResult);

  const clearButton = document.createElement("button");
  clearButton.className = "text-gray-400 hover:text-white flex items-center justify-center w-6 h-6";
  clearButton.innerHTML = '<i class="fas fa-times text-xs"></i>';
  clearButton.title = "Limpiar búsqueda";
  clearButton.id = "clearSearch";
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    clearSearch();
  });

  const resultCounter = document.createElement("span");
  resultCounter.className = "text-xs text-gray-400 inline-flex items-center";
  resultCounter.id = "searchResultCounter";
  resultCounter.textContent = "0/0";

  buttonsContainer.appendChild(resultCounter);
  buttonsContainer.appendChild(prevButton);
  buttonsContainer.appendChild(nextButton);
  buttonsContainer.appendChild(clearButton);

  searchContainer.appendChild(buttonsContainer);

  searchInput.style.paddingRight = "100px";
}

function performSearch(searchTerm) {
  if (searchTerm.length < 2) {
    return;
  }

  searchResults = transcriptions.filter((item) => item.transcripcion.toLowerCase().includes(searchTerm));

  updateSearchResults(searchTerm);
  updateResultCounter();
}

function navigateToNextResult() {
  if (searchResults.length === 0) return;

  currentResultIndex++;
  if (currentResultIndex >= searchResults.length) {
    currentResultIndex = 0;
  }

  focusOnResult(currentResultIndex);
}

function navigateToPrevResult() {
  if (searchResults.length === 0) return;

  currentResultIndex--;
  if (currentResultIndex < 0) {
    currentResultIndex = searchResults.length - 1;
  }

  focusOnResult(currentResultIndex);
}

function focusOnResult(index) {
  const activeResults = document.querySelectorAll(".current-search-result");
  activeResults.forEach((el) => {
    el.classList.remove("current-search-result");
    el.classList.remove("animate-pulse");
  });

  if (searchResults.length === 0) return;

  const result = searchResults[index];
  const resultRow = findRowByIndex(result);

  if (resultRow) {
    const tableContainer = document.querySelector(".overflow-y-auto");
    if (tableContainer) {
      resultRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    resultRow.classList.add("current-search-result");

    const highlights = resultRow.querySelectorAll(".bg-yellow-500\\/30");
    highlights.forEach((highlight) => {
      highlight.classList.add("animate-pulse");
    });

    updateResultCounter();
  }
}

function findRowByIndex(item) {
  const index = transcriptions.indexOf(item);
  if (index === -1) return null;

  return document.querySelector(`tr[data-index="${index}"]`);
}

function updateResultCounter() {
  const counter = document.getElementById("searchResultCounter");
  if (!counter) return;

  if (searchResults.length === 0) {
    counter.textContent = "0/0";
    return;
  }

  const current = currentResultIndex >= 0 ? currentResultIndex + 1 : 1;
  counter.textContent = `${current}/${searchResults.length}`;
}

function updateSearchResults(searchTerm) {
  const transcriptionsTable = document.getElementById("transcriptionsTable");
  const rows = transcriptionsTable.querySelectorAll("tr");

  rows.forEach((row) => {
    row.classList.remove("bg-yellow-900/20");

    const transcriptionCell = row.querySelector("td:nth-child(3)");
    if (transcriptionCell) {
      transcriptionCell.innerHTML = transcriptionCell.textContent;
      
      // Después de restablecer el contenido, verificamos si la fila estaba seleccionada
      const index = parseInt(row.dataset.index);
      const isSelected = selectedTranscriptions.some((t) => t.index === index);
      
      // Aseguramos que el botón mantiene el estilo correcto
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
  });

  let matchCount = 0;
  rows.forEach((row) => {
    const index = parseInt(row.dataset.index);
    const match = searchResults.find((item) => item === transcriptions[index]);

    if (match) {
      matchCount++;
      row.classList.add("bg-yellow-900/20");

      const transcriptionCell = row.querySelector("td:nth-child(3)");
      if (transcriptionCell) {
        const text = transcriptionCell.textContent;
        const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
        transcriptionCell.innerHTML = text.replace(
          regex,
          '<span class="bg-yellow-500/30 text-white px-1 rounded">$1</span>'
        );
      }
    }
  });

  if (matchCount > 0) {
    showNotification(`Se encontraron ${matchCount} coincidencias`);
  } else if (searchTerm.length >= 2) {
    showNotification("No se encontraron coincidencias");
  }
}

function clearSearch() {
  currentSearchTerm = "";
  searchResults = [];
  currentResultIndex = -1;
  updateResultCounter();

  const transcriptionsTable = document.getElementById("transcriptionsTable");
  const rows = transcriptionsTable.querySelectorAll("tr");

  rows.forEach((row) => {
    row.classList.remove("bg-yellow-900/20");
    row.classList.remove("current-search-result");

    const transcriptionCell = row.querySelector("td:nth-child(3)");
    if (transcriptionCell) {
      transcriptionCell.innerHTML = transcriptionCell.textContent;
    }
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function updateSearchAfterRowsLoaded() {
  if (currentSearchTerm.length >= 2) {
    performSearch(currentSearchTerm);
  }
}

export function highlightSearchResults() {
  if (currentSearchTerm.length >= 2) {
    updateSearchResults(currentSearchTerm);
  }
}
