# Clipperino

Clipperino is a powerful web-based tool designed to help you manage, select, and export clips from audio or video transcriptions. It allows you to import CSV files containing timestamped text, select relevant lines, group them into custom clips, preview them against a video file, and export your work in various formats including JSON, Markdown, and EDL (Edit Decision List) for DaVinci Resolve.

## Key Features

- **CSV Import**: Easily load CSV files with time-segmented transcriptions.
- **Efficient Line Selection**: Scroll through thousands of lines with an optimized infinite scrolling table.
- **Smart Search**: Quickly find text within transcriptions with instant navigation to results.
- **Clip Management**: Group selected lines into named clips, edit names, or remove them.
- **Video Preview Tab**:
  - Load a local video file to preview your clips.
  - Interactive timeline visualization of created clips.
  - Custom video controls including Play/Pause, Next/Previous Clip.
  - **Audio Output Selection**: Choose specific audio output devices (e.g., headphones vs speakers).
  - **Zoom & Scrubbing**: Zoom into the timeline for precision and scrub through the video with magnetic snapping to clip start/end points.
- **Export Options**:
  - **JSON**: For data backup or use in other tools.
  - **Markdown**: For readable text summaries.
  - **EDL**: Export standard `.edl` files compatible with DaVinci Resolve.
- **Local Persistence**: All your data (transcripts, clips, video metadata) is automatically saved to your browser's LocalStorage, so you never lose progress on refresh.

## Usage

1.  **Import Transcripts**: Click "Import CSV" and select your file.
2.  **Select Lines**: Click "Select" on lines you want. Hold `Shift` to select a range.
3.  **Create a Clip**: Click "Add Clip", give it a name, and save.
4.  **Preview**: Switch to the **Preview** tab, load your video file, and watch your clips on the timeline.
5.  **Export**: Use the buttons in the sidebar to download your work.

## Expected CSV Format

The CSV file must contain at least three columns (order doesn't matter as long as headers are present): `start`, `end`, and `transcript`.

Example:
```csv
Start,End,Transcript
00:00:00,00:00:05,Welcome to the video!
00:00:05,00:00:10,Today we are going to learn about...
```

## Credits

- **Icons**: [Lucide Icons](https://lucide.dev/)
- **EDL Logic**: Adapted from [Marker Converter by Enbyss](https://www.enbyss.com/tools/marker-converter)

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL v3).
