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
  const updateReady = ref(false);
  const savedAt = ref(0);
  const tourStep = ref(-1);
  let toastId = 0;
  let pendingConfirm = null;

  /** Shows a toast that dismisses itself. */
  function notify(message) {
    const id = ++toastId;
    toasts.value.push({ id, message });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, TOAST_MS);
  }

  /** Opens a modal by name; `payload` is readable by that modal. Any other modal declines a pending `confirm`. */
  function open(name, payload = null) {
    if (name !== "confirm") settleConfirm(false);
    modalPayload.value = payload;
    openModal.value = name;
  }

  /** Closes the open modal; a pending `confirm` resolves to `false`. */
  function close() {
    settleConfirm(false);
    openModal.value = null;
    modalPayload.value = null;
  }

  /** Asks for confirmation in a modal; `tone` is "danger" (default) or "neutral". Resolves to whether the user accepted. */
  function confirm({ title, message, confirmLabel = "Confirm", tone = "danger" }) {
    settleConfirm(false);
    return new Promise((resolve) => {
      pendingConfirm = resolve;
      open("confirm", { title, message, confirmLabel, tone });
    });
  }

  /** Resolves the pending `confirm` (if any) and closes its modal. */
  function answerConfirm(accepted) {
    settleConfirm(accepted);
    close();
  }

  function settleConfirm(accepted) {
    pendingConfirm?.(accepted);
    pendingConfirm = null;
  }

  /** Starts the guided tour from the Editor tab; `TourOverlay` advances `tourStep`, `-1` means no tour. */
  function startTour() {
    close();
    activeTab.value = "editor";
    tourStep.value = 0;
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
    updateReady,
    savedAt,
    tourStep,
    notify,
    open,
    close,
    confirm,
    answerConfirm,
    startTour,
    navigateToLine,
  };
});
