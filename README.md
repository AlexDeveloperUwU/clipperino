# Clipperino

Clipperino is a web-based tool to manage, select and export clips from video transcriptions. Import a CSV of timestamped text, select lines, group them into named clips, preview them against a local video file, and export JSON or an EDL (Edit Decision List) for DaVinci Resolve.

## AI usage

![AI usage: Co-created](https://img.shields.io/badge/AI%20usage-Co--created-f97316)

As mentioned in [my personal README](https://github.com/AlexDeveloperUwU/alexdeveloperuwu#readme), this project's level of AI usage is **Co-created**: a lot of the project was AI-assisted.

## Key Features

- **CSV Import**: load time-segmented transcriptions by button or drag and drop.
- **Efficient Line Selection**: scroll thousands of lines in a windowed table; hold `Shift` to select a range.
- **Smart Search**: find text across the transcript and jump between results.
- **Clip Management**: group selected lines into named clips, rename, re-edit or delete them.
- **Video Preview**: load a local video (button or drag and drop), see clips on an interactive timeline (zoom, scrub with magnetic snapping, previous/next clip), toggle a subtitle overlay and pick the audio output device. A video shorter than the transcript is rejected as the wrong one, and in Chrome and Edge a saved project reopens its video in one click.
- **Export**: JSON, and EDL for DaVinci Resolve.
- **Project files**: save and reopen the whole session as a compressed `.clpproj` file.
- **Local persistence**: the session is saved to your browser's LocalStorage automatically.
- **Offline**: installable PWA that works without a connection.

## Usage

1. **Import Transcripts**: click "Import CSV" (or drop a `.csv` file).
2. **Select Lines**: click "Select" on a line. Hold `Shift` to select a range.
3. **Create a Clip**: click "Add Clip", name it and save.
4. **Preview**: open the **Preview** tab, load your video and watch your clips on the timeline.
5. **Export**: use the buttons in the sidebar, or save the whole session as a project.

### Shortcuts

- `Shift` + click selects a range of lines.
- `Space` plays or pauses the video (Preview tab).
- In the search box: `Enter` jumps to the next match, `Esc` clears.

## Expected CSV Format

Columns are positional: start time, end time, then the transcript text. A first row whose start column is not a time is treated as a header and skipped. Times are `MM:SS` or `HH:MM:SS`.

```csv
Start,End,Transcript
00:00:00,00:00:05,Welcome to the video!
00:00:05,00:00:10,Today we are going to learn about...
```

### Generating a transcript from YouTube

[`utils/Clipperino_Transcript.ipynb`](utils/Clipperino_Transcript.ipynb) is a Google Colab notebook that downloads a video's audio, transcribes it with Whisper large-v3 on a GPU runtime, and produces a `transcript.csv` ready to import. It normalizes the audio, filters hallucinated loops, splits long segments into short rows and retries long silent gaps. Open it in Colab, pick a T4 GPU runtime and follow the steps in its first cell.

## Development

Vue 3 + Vite + Pinia + Tailwind CSS (JavaScript, no TypeScript).

```bash
npm install
npm run dev       # dev server with Vue DevTools (dev only)
npm run build     # production build to dist/
npm run preview   # serve the production build
npm run lint
npm run format
```

Deploy `dist/` to any static host (Cloudflare Pages: build command `npm run build`, output directory `dist`).

### Versioning

The version lives in `package.json` only. Bump it with `npm version <patch|minor|major> --no-git-tag-version` and add the entry to `CHANGELOG.md`; the footer, project files and PWA cache pick it up on the next build.

### Structure

Dependencies point one way: `components` → `composables` / `stores` / `services` → `lib`.

```
src/
  main.js, App.vue
  lib/          pure helpers, no Vue or browser state: csv, timecode, clips, text (search),
                timeline, exporters (JSON / EDL), projectFormat (.clpproj codec)
  stores/       Pinia state and rules: project (transcript, selection, clips),
                media (video, playback), search, ui (tabs, modals, toasts)
  services/     side effects around the stores: persistence (localStorage),
                projectFile (.clpproj save/open), importCsv, download,
                videoPicker + handleStore (remembers the video file, IndexedDB)
  composables/  reusable component logic: useRowWindow, useTimelineScrub, useFileDrop
  components/   editor/, preview/, modals/, plus header, footer and toasts
utils/          Clipperino_Transcript.ipynb (Colab notebook that creates the CSV)
```

Code conventions: English only, JSDoc on exported functions and store actions, no inline `//` comments or banner comments, store arrays are replaced rather than mutated.

## Credits

- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Markdown Rendering**: [marked](https://marked.js.org/)
- **EDL Logic**: Adapted from [Marker Converter by Enbyss](https://www.enbyss.com/tools/marker-converter)

## License

Licensed under the GNU Affero General Public License v3.0 (AGPL v3).
