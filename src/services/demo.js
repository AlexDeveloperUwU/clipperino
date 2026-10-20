import demoCsv from "../demo/demo.csv?raw";
import { parseCsv } from "../lib/csv.js";
import { buildClip } from "../lib/clips.js";
import { useProjectStore } from "../stores/project.js";
import { useMediaStore } from "../stores/media.js";
import { useUiStore } from "../stores/ui.js";

const DEMO_VIDEO = "demo/demo.mp4";
const SWAP_MS = 250;
const REVEAL_MS = 250;
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PROMPTS = {
  tour: {
    title: "Start the tour?",
    message:
      "The tour opens a demo project that replaces your current transcript, clips and video.",
    confirmLabel: "Start tour",
  },
  demo: {
    title: "Load the demo project?",
    message: "The demo project replaces your current transcript, clips and video.",
    confirmLabel: "Load demo",
  },
};

/** Fades the workspace out, swaps in the demo project and fades it back in; the video loads in the background. */
async function openDemo({ tour }) {
  const ui = useUiStore();
  ui.close();
  const project = useProjectStore();
  const media = useMediaStore();

  if (!project.demoActive && (project.isActive || media.meta.name)) {
    const accepted = await ui.confirm({ ...PROMPTS[tour ? "tour" : "demo"], tone: "neutral" });
    if (!accepted) return;
  }

  ui.tourStep = -1;
  ui.swapping = true;
  await sleep(SWAP_MS);

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
  ui.swapping = false;
  loadDemoVideo();

  await sleep(SWAP_MS + REVEAL_MS);
  if (tour) ui.tourStep = 0;
  else ui.notify("Demo project loaded — take the tour from the banner any time");
}

/** Opens the bundled demo project (never autosaved) and starts the interactive tour on it. */
export const startTour = () => openDemo({ tour: true });

/** Opens the bundled demo project without the tour. */
export const loadDemo = () => openDemo({ tour: false });

/** Removes the demo transcript, clips and video. */
export function exitDemo() {
  useProjectStore().clearAll();
  useMediaStore().clear({ silent: true });
}
