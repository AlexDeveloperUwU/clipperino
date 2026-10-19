import { ref } from "vue";
import { defineStore } from "pinia";

const TOAST_MS = 3000;

/** Active tab, the open modal (with an optional payload), toasts and table-navigation requests. */
export const useUiStore = defineStore("ui", () => {
  const activeTab = ref("editor");
  const openModal = ref(null);
  const modalPayload = ref(null);
  const toasts = ref([]);
  const goToLine = ref({ index: -1, nonce: 0 });
  let toastId = 0;

  /** Shows a toast that dismisses itself. */
  function notify(message) {
    const id = ++toastId;
    toasts.value.push({ id, message });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, TOAST_MS);
  }

  /** Opens a modal by name; `payload` is readable by that modal. */
  function open(name, payload = null) {
    modalPayload.value = payload;
    openModal.value = name;
  }

  /** Closes the open modal. */
  function close() {
    openModal.value = null;
    modalPayload.value = null;
  }

  /** Asks the transcript table to scroll to and flash a line. */
  function navigateToLine(index) {
    goToLine.value = { index, nonce: goToLine.value.nonce + 1 };
  }

  return {
    activeTab,
    openModal,
    modalPayload,
    toasts,
    goToLine,
    notify,
    open,
    close,
    navigateToLine,
  };
});
