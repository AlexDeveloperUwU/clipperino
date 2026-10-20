import { onMounted, ref } from "vue";
import { useMediaStore } from "../stores/media.js";
import { useUiStore } from "../stores/ui.js";

/** Audio output devices and routing of the video's sound to the chosen one. */
export function useAudioOutputs() {
  const media = useMediaStore();
  const ui = useUiStore();

  const supported = !!navigator.mediaDevices?.enumerateDevices;
  const outputs = ref([]);
  let unlockedLabels = false;

  async function refreshOutputs() {
    if (!supported) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      outputs.value = devices.filter((d) => d.kind === "audiooutput" && d.deviceId !== "default");
    } catch (err) {
      console.warn("Could not enumerate audio devices:", err);
    }
  }

  /** Device labels stay blank until a media permission is granted, so ask on first use. */
  async function unlockLabels() {
    if (unlockedLabels || !supported) return;
    unlockedLabels = true;
    await navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => stream.getTracks().forEach((t) => t.stop()))
      .catch(() => undefined);
    await refreshOutputs();
  }

  async function onOutputChange(event) {
    const el = media.element;
    if (!el || !("setSinkId" in el)) {
      ui.notify("Audio output switching not supported in this browser");
      return;
    }
    try {
      await el.setSinkId(event.target.value);
      ui.notify("Audio output changed");
    } catch (error) {
      console.error("Error setting audio output:", error);
      ui.notify("Failed to change audio output");
    }
  }

  onMounted(refreshOutputs);

  return { supported, outputs, unlockLabels, onOutputChange };
}
