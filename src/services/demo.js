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

/** Loads the bundled demo transcript, clips and video; the demo is never autosaved. */
export async function loadDemo() {
  const ui = useUiStore();
  const project = useProjectStore();
  const media = useMediaStore();

  if (project.isActive || media.meta.name) {
    const accepted = await ui.confirm({
      title: "Load the demo?",
      message: "The demo replaces your current transcript, clips and video.",
      confirmLabel: "Load demo",
    });
    if (!accepted) return;
  }

  const { lines } = parseCsv(demoCsv);
  const clips = DEMO_CLIPS.map(({ name, indices }) =>
    buildClip(
      indices.map((index) => ({ ...lines[index], index })),
      name,
    ),
  );
  project.restore({ transcriptions: lines, clips });
  media.clear({ silent: true });
  ui.demoActive = true;
  ui.activeTab = "editor";
  ui.notify("Demo loaded — explore it, then exit from the banner");

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}${DEMO_VIDEO}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    media.load(new File([await response.blob()], "demo.mp4", { type: "video/mp4" }));
  } catch (e) {
    console.error("Error loading demo video:", e);
    ui.notify("Demo video unavailable — the editor still works without it");
  }
}

/** Removes the demo transcript, clips and video. */
export function exitDemo() {
  useProjectStore().clearAll();
  useMediaStore().clear({ silent: true });
}
