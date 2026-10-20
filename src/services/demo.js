import demoCsv from "../demo/demo.csv?raw";
import { parseCsv } from "../lib/csv.js";
import { buildClip } from "../lib/clips.js";
import { useProjectStore } from "../stores/project.js";
import { useMediaStore } from "../stores/media.js";
import { useUiStore } from "../stores/ui.js";

const DEMO_VIDEO = "demo/demo.mp4";
const DEMO_CLIPS = [
  { name: "Building clips", indices: [3, 4, 5] },
  { name: "Preview and export", indices: [9, 10, 11] },
];

async function loadDemoVideo() {
  const project = useProjectStore();
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}${DEMO_VIDEO}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    if (!project.demoActive) return;
    useMediaStore().load(new File([blob], "demo.mp4", { type: "video/mp4" }));
  } catch (e) {
    console.error("Error loading demo video:", e);
    useUiStore().notify("Demo video unavailable — the editor still works without it");
  }
}

/**
 * Starts the interactive tour on the bundled demo project (never autosaved); the video loads in the background.
 * Does nothing when the user declines to replace their current work.
 */
export async function startTour() {
  const ui = useUiStore();
  ui.close();
  const project = useProjectStore();
  const media = useMediaStore();

  if (!project.demoActive && (project.isActive || media.meta.name)) {
    const accepted = await ui.confirm({
      title: "Start the tour?",
      message:
        "The tour opens a demo project that replaces your current transcript, clips and video.",
      confirmLabel: "Start tour",
      tone: "neutral",
    });
    if (!accepted) return;
  }

  const { lines } = parseCsv(demoCsv);
  const timestamp = new Date().toISOString();
  const clips = DEMO_CLIPS.map(({ name, indices }) =>
    buildClip(
      indices.map((index) => ({ ...lines[index], index })),
      name,
      timestamp,
    ),
  );
  project.restore({ transcriptions: lines, clips });
  media.clear({ silent: true });
  project.setDemoActive(true);
  ui.activeTab = "editor";
  ui.tourStep = 0;
  loadDemoVideo();
}

/** Removes the demo transcript, clips and video. */
export function exitDemo() {
  useProjectStore().clearAll();
  useMediaStore().clear({ silent: true });
}
