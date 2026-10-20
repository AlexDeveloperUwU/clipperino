# Changelog

All notable changes to Clipperino are documented here.

## [2.3.0] - 2026-10-20

### Added

- The guided tour is now an interactive walkthrough of the demo project. It asks you to do each action (select lines, build and edit a clip, export, then play, skip, subtitles, volume, scrub, seek, zoom and swap the video on the Preview tab) and moves on when you do, with Back, Skip step and a closing screen
- Shift-click on a line's text now selects a range instead of being blocked by text selection
- Arrow keys seek on the Preview tab even after clicking a button

### Changed

- "Take the interactive tour" replaces the separate tour and demo buttons; the tour loads the demo project
- Tour highlight and popup glide between steps, and the popup text cross-fades
- The dev server no longer flashes a white border on load (stylesheet linked from `index.html`, dark background set before first paint)
- Demo transcript lines reworded to match the new tour

## [2.2.2] - 2026-10-20

### Changed

- The demo video is now a 1280×720, 30 fps animation with each transcript line revealed word by word in sync with its timestamps, a step progress bar and an end card, instead of a tiny test pattern. It has no audio

### Fixed

- The "No clips created" and "Select lines from the table above" empty states are now centered in their panels

## [2.2.1] - 2026-10-20

### Fixed

- Dropping a file while a dialog is open no longer makes the browser leave the app
- Esc and Tab in dialogs keep working after clicking text inside them
- Shift-range selection no longer picks lines already used by another clip
- Exiting the demo while its video is loading no longer loads the video into your own session
- Space and arrow shortcuts ignore modifier keys, so Alt+Left (browser back) works again in Preview
- The Shift hint no longer appears while typing in a field or dialog
- CSV delimiter detection ignores punctuation in the text column, and rows with an empty end time are skipped
- Autosave writes all fields or none, and the storage-full warning shows once instead of on every save
- Pausing or swapping the video no longer logs an unhandled error, and downloads release their file URL after the click

### Changed

- The guided tour traps keyboard focus, re-measures when the layout shifts and returns focus when it ends
- Confirmations for non-destructive actions, like loading the demo, use a blue button instead of red
- The changelog viewer loads on demand, cutting the initial bundle by about a third
- Brand assets moved to `docs/brand` and are no longer shipped with the app
- Internal cleanup: pure `lib/`, volume and project-file code moved to services, timeline zoom, audio outputs, file picking and export extracted from components, shared Tailwind classes, and unused code removed

## [2.2.0] - 2026-10-19

### Added

- First-run welcome, a six-step guided tour and an empty-state guide with the expected CSV format
- Bundled demo project (transcript, two clips and a short video) that is never autosaved, with an "Exit demo" banner; also reachable from Help
- In-app confirmation dialog before clearing data, deleting a clip, clearing the video, replacing the transcript or opening a project
- Click anywhere on a transcript row to select it; arrow keys seek 5 seconds in Preview
- Clip cards show the first line of text; export buttons are disabled when there are no clips
- Help now explains the CSV format, saving, video length rule, keyboard shortcuts and EDL export
- Drop a CSV, video or `.clpproj` file anywhere in the app and it is routed by type
- Volume slider and mute button in Preview; the level is remembered
- A quiet "Saved" tick in the footer after each autosave
- "Ready to work offline" notice and an "Update available" footer button, so updates no longer reload the page unasked
- Notice on screens narrower than 700px that the app is built for tablets and larger

### Changed

- CSV import accepts UTF-8 BOM files and `;` delimiters, and reports how many lines were imported and skipped
- Importing a CSV over an existing transcript removes the clips that referenced the old lines
- Import CSV and Open Project are real buttons, reachable by keyboard
- Timeline scrubbing uses pointer events, so it works with touch and pen; header buttons shorten to fit tablet widths
- Modals have dialog semantics, close on Esc, trap focus and return it on close; tabs expose tab roles
- Darker filled buttons and muted gray text for better contrast; animations are reduced when the system asks for it
- Search toasts only report "No matches found"; toasts are announced to screen readers

### Fixed

- Space now plays and pauses right after switching tabs
- An empty or invalid CSV shows an error instead of silently doing nothing

## [2.1.0] - 2026-10-19

### Added

- New brand identity: scissors-on-timeline mark, mono mark, light and dark wordmarks, and a `BRAND.md` guide
- Maskable PWA icon

### Changed

- Header, footer, favicon, PWA icon and README now use the new mark

## [2.0.3] - 2026-10-19

### Changed

- The transcript notebook now works from a generic `/content/clipperino` folder instead of a personal path

## [2.0.2] - 2026-10-19

### Changed

- Rewrote the Colab transcript notebook: it normalizes the audio, removes Whisper's looping and "thanks for watching" artifacts, splits long segments into short rows, and retries long silent gaps
- Documented the notebook in the README

## [2.0.1] - 2026-10-19

### Changed

- Replaced the deprecated `lucide-vue-next` package with `@lucide/vue`

## [2.0.0] - 2026-10-19

### Added

- Videos can be dragged and dropped onto the Preview tab, like CSVs in the Editor
- In Chrome and Edge, **Re-import Video** reopens the saved video in one click (after the browser's read-permission prompt), and the file picker opens in the video's folder; other browsers keep the standard file dialog
- A video shorter than the transcript (by more than 3 seconds) is rejected as the wrong video, with a single clear message; the saved video name is kept so you can try again
- Vue DevTools in the dev server
- Web app manifest and icon

### Changed

- Rebuilt the app on Vue 3 with Vite, Pinia and a compiled Tailwind build — one reactive store replaces the hand-synced state, DOM registry and `window.*` hooks
- The version now lives only in `package.json`; the footer, project files and service-worker cache all follow it
- The service worker is generated by `vite-plugin-pwa`, so cached assets update automatically on every release
- The timeline covers the whole transcript, zooms to fit the video, and can zoom out below 100%
- Clips that start past the end of the video explain why they can't be reached instead of jumping to the last frame
- Search highlighting, notifications and the transcript table render through Vue templates instead of `innerHTML`
- Audio-device labels are requested the first time the output selector is used instead of on page load
- Stricter Content-Security-Policy (production builds only, no third-party origins); Inter is now bundled
- Modals fade and scale in and out
- A CSV header row is detected by its first column not being a time, so headers such as "From,To,Text" are skipped

### Removed

- The Viewer tab and standalone JSON import — open a `.clpproj` project to browse clips instead
- Markdown export — clips now export as JSON or EDL

### Fixed

- Clearing the video now also clears its saved metadata
- Replacing a video no longer leaks the previous object URL
- The editor table keeps its scroll position after saving, editing or deleting a clip
- An empty session no longer triggers the "Welcome back" prompt, and the saved session can't be overwritten by an empty one before the prompt is answered
- Panel corners render as full rounded borders
- Editing a clip no longer replays its fade-in animation

## [1.11] - 2026-09-01

### Security

- Escaped all transcript text, clip names and notification messages before rendering (imported CSV/JSON content can no longer inject HTML or script)
- Added a Content-Security-Policy meta tag as defense-in-depth

### Fixed

- CSV parser now fully complies with RFC 4180: quoted fields containing commas, line breaks and escaped `""` quotes parse correctly (multi-line transcripts were silently corrupted before)
- A corrupted localStorage key no longer prevents the rest of the session from being restored
- Reaching the storage quota now shows a visible warning instead of failing silently
- The timeline no longer draws clips against a fake 10-second fallback duration when no video is loaded (shows a hint instead)
- Timeline snapping and previous/next clip navigation now consider both project clips and imported JSON clips

### Changed

- Saves are debounced and flushed on page hide — selecting a line no longer re-serializes the whole transcript on every click
- Subtitle lookup precomputes timecodes instead of parsing strings on every playback tick
- Timeline scrubbing seeks at most once per animation frame
- Play/pause icon toggles without a full-document icon rescan

## [1.10] - 2026-05-31

### Added

- Project files — save the whole working session (transcript, clips, in-progress selection, video name/duration) to a compressed `.clpproj` file and re-open it later to pick up where you left off, even if local storage is lost. Video files are not bundled (re-load on open). Use the **Save Project** / **Open Project** buttons in the header.

### Changed

- The Viewer now mirrors your project's clips live while a project is open, staying in sync with the Editor and Preview tabs. Its standalone JSON import is locked (shown by a "Synced with project" badge) until the project is cleared; with no project open, the Viewer still works as a standalone JSON inspector.

## [1.9] - 2026-05-31

### Added

- Changelog modal — click the version badge in the footer to view release history
- JSON clips imported in the Viewer tab now appear on the Preview timeline, enable subtitle display, and support previous/next clip navigation

### Changed

- UI enhancements across the app

## [1.8] - 2025-12-01

### Added

- Subtitle overlay on video preview — transcript lines follow playback automatically
- Subtitle toggle button in the preview controls (CC button)

## [1.7] - 2025-12-01

### Changed

- Improved multi-select behaviour and editing flow in the Editor tab
- Last viewed line is now persisted across sessions

## [1.6] - 2025-11-30

### Added

- Audio output device selection in the Preview tab
- Timeline zoom controls (zoom in/out + manual input)
- Mouse scrubbing on the timeline with magnetic snap to clip start/end boundaries
- Improved search result navigation

## [1.4] - 2025-11-30

### Added

- Video Preview tab with interactive timeline visualisation of clips
- Previous/Next Clip navigation controls
- Video playback controls (play/pause, timeline scrubbing)

## [1.3] - 2025-11-29

### Added

- Drag-and-drop JSON import in the Viewer tab
- UI improvements across all tabs

## [1.0] - 2025-05-15

### Added

- Initial release
- CSV import with timestamp parsing (`start`, `end`, `transcript` columns)
- Line selection with Shift+click multi-select
- Clip creation with custom names
- Export to JSON, Markdown, and EDL (DaVinci Resolve compatible)
- Service worker for PWA / offline support
- DaVinci Resolve markers export
