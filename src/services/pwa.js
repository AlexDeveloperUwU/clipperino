import { registerSW } from "virtual:pwa-register";
import { useUiStore } from "../stores/ui.js";

let updateServiceWorker = null;

/** Registers the service worker; a new version waits until the user applies it. */
export function registerPwa() {
  const ui = useUiStore();
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh: () => (ui.updateReady = true),
    onOfflineReady: () => ui.notify("Ready to work offline"),
  });
}

/** Activates the waiting version and reloads the page. */
export function applyUpdate() {
  updateServiceWorker?.(true);
}
