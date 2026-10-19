# Clipperino brand

## Mark
Scissors cutting across a timeline: the emerald segment is the clip. Files in `public/brand/`: `mark.svg`, `mark-mono.svg` (`currentColor`), `wordmark.svg` (light text), `wordmark-light.svg` (dark text, for light backgrounds). App icons: `public/icon.svg`, `public/icon-maskable.svg`.

- Clear space: half the tile width on every side.
- Minimum size: 16 px (mark), 120 px wide (wordmark).
- Wordmarks use live `<text>` in Inter; convert to outlines before print use.
- Do not recolor the blades, rotate, or add shadows.

## Color
Mirrors `tailwind.config.js`.

| Token | Hex | Use |
|---|---|---|
| `dark-400` | `#0a0a0a` | Tile, theme color |
| `dark-300` | `#121212` | App background |
| `dark-200` | `#171717` | Panels |
| `dark-100` | `#1e1e1e` | Raised surfaces |
| `dark-50` | `#2d2d2d` | Borders |
| `accent-100` | `#3b82f6` | Primary, blades |
| `accent-200` | `#2563eb` | Primary hover, track |
| `secondary-100` | `#10b981` | Clip / success |
| `secondary-200` | `#059669` | Clip hover |

## Type
Inter Variable. Wordmark 700, tracking -0.03em. UI body 400/500.
