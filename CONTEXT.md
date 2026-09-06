# Signage Layout Editor — Context for Codex

> Last updated: 2026-09-06
> Handover from Lovable. This file explains the architecture, data model, and conventions so you can keep building.

## What this project is

A browser-based **digital signage layout editor**. The user composes screen layouts by dragging and resizing zones on a canvas. The editor is designed for landscape/desktop use (the actual signage players run in browsers on large screens).

Current scope is the editor itself. Runtime playback, backend persistence, and multi-layout management are natural next steps but not yet implemented.

## Tech stack

- **Framework:** TanStack Start v1 (full-stack React 19, file-system routing)
- **Build tool:** Vite 8
- **Styling:** Tailwind CSS v4 via `@import "tailwindcss"` in `src/styles.css`
- **UI primitives:** shadcn/ui components under `src/components/ui/`
  - `button`, `input`, `slider`, `switch`, `sonner` (toast) are actively used
- **Icons:** `lucide-react`
- **State:** React `useState`/`useCallback` (no external state library)
- **Persistence:** `localStorage` only
- **No backend currently required.**

## File layout

```
src/
├── routes/
│   ├── __root.tsx          # Root layout; renders <Outlet />
│   └── index.tsx           # THE EDITOR (all current logic lives here)
├── components/ui/          # shadcn/ui primitives
├── styles.css              # Tailwind v4 theme tokens (light + dark)
└── lib/utils.ts            # cn() helper
```

All editor code is intentionally in one route file (`src/routes/index.tsx`) because the UI is tightly coupled. Split into hooks/components only when the file becomes painful.

## Data model

### Zone

```ts
type ZoneKind = "video" | "image" | "ticker" | "clock" | "weather" | "web";

type Zone = {
  id: string;
  name: string;
  kind: ZoneKind;
  x: number;        // % from left   (0–100)
  y: number;        // % from top    (0–100)
  w: number;        // width %       (min 5)
  h: number;        // height %      (min 5)
  locked: boolean;  // prevents drag/resize
  opacity: number;  // 10–100
};
```

Coordinates are percentages so the same layout scales to any physical screen.

### Settings

```ts
type Settings = {
  snapToGrid: boolean;
  gridSize: number;   // one of [2.5, 5, 10, 20]  (%)
  showGrid: boolean;
  alignSnap: boolean;
  threshold: number;  // pixel distance for alignment snap (2–24)
};
```

### Presets

```ts
const PRESETS = [
  { id: "landscape", label: "16:9 Landscape", ratio: 16 / 9 },
  { id: "portrait",  label: "9:16 Portrait",  ratio: 9 / 16 },
  { id: "ultrawide", label: "32:9 Video wall", ratio: 32 / 9 },
];
```

The canvas is sized by `aspectRatio` and fits within the available height.

## UI layout

Three-column workbench:

| Left (w-56)          | Center (flex-1)          | Right (w-72)           |
|----------------------|--------------------------|------------------------|
| Screen preset picker | Canvas header            | Layers list            |
| Zone library         | Stage with grid + zones  | Inspector              |
| Grid & snapping      | Guides/gaps/marquee      |                        |

Top header: logo + title + layout name input + reset/preview/save buttons.

## Key interactions

| Action                         | How it works |
|-------------------------------|--------------|
| Add zone                      | Click or drag a zone kind from the left library onto the canvas |
| Move zone(s)                  | Drag a zone body; moves all unlocked selected zones |
| Resize zone(s)                | Drag the bottom-right resize handle; resizes all selected unlocked zones by same delta |
| Select single                 | Click zone or layer row |
| Multi-select / toggle         | Shift-click zone or layer row |
| Marquee select                | Drag on empty canvas (shift adds to selection) |
| Lock/unlock                   | Click lock icon in layer row |
| Duplicate                     | Inspector button or `Ctrl/Cmd+D` |
| Delete                        | Inspector button or `Delete`/`Backspace` |
| Select all                    | `Ctrl/Cmd+A` (ignored when typing in inputs) |
| Snap to grid                  | `snapToGrid` rounds values to `gridSize` |
| Alignment snap                | Edges/centres snap to canvas midlines and other zones within `threshold` px |
| Distance indicators           | Blue gap labels appear between nearby aligned edges during drag |
| Opacity                       | Per-zone or multi-zone slider in inspector |

## State helpers to know

- `update(id, patch)` — single zone patch.
- `updateMany({ [id]: patch })` — multi-zone patch, used for moving/resizing selections together.
- `snapVal(v)` — grid-aware rounding.
- `alignSnapX` / `alignSnapY` — return `{ x|y, guides[] }`.
- `computeGaps(zone, others)` — returns `Gap[]` for the blue distance labels.
- `startLibraryDrag`, `startDrag`, `startMarquee` — pointer handlers.

## Persistence

- Key: `"signage-layout-editor:v1"`
- Stored: `{ zones, name, presetId, settings }`
- Auto-saves on every change; `savedAt` timestamp shown in header.
- A `Reset` button restores the hard-coded starter layout (`START`).

## Styling conventions

- **Light theme is default.** Dark mode exists via `.dark` class in `src/styles.css`.
- **Never hardcode colors.** Use semantic tokens: `bg-card`, `border-border`, `bg-surface`, `text-muted-foreground`, `bg-primary`, `text-accent`, etc.
- **Custom zone colors:** exposed as `var(--zone-1)` through `var(--zone-5)` and registered as Tailwind colors `zone-1`…`zone-5`.
- **Utility classes used:** `label-caps` for small uppercase labels, `panel` for raised cards.
- **Grid overlay color:** `var(--grid-line)`.

## Design decisions you should preserve

1. **Percent-based geometry.** Keeps layouts resolution-independent.
2. **Single source of truth in `zones`.** Derived values (`selected`, `coverage`) are `useMemo`.
3. **Pointer events, not mouse events.** Supports touch and keeps drag logic consistent.
4. **Selection follows intent, not transient hover.** Active zones get a solid `border-2`; inactive are `border-dashed`.
5. **Library items are draggable AND clickable.** `startLibraryDrag` falls back to `addZone()` if the pointer barely moved.
6. **Guides/gaps are ephemeral.** They clear on `pointerup`.

## Likely next features

- **Runtime player route** (`/play/:id`) that reads the layout and renders the actual content.
- **Backend persistence** (e.g. Lovable Cloud/Supabase) so layouts can be saved and shared.
- **Content assignment** — map each zone to a specific video URL, image URL, RSS ticker, weather location, etc.
- **Scheduling / playlists** — switch layouts by time of day.
- **Device management** — pair players to layouts.
- **Overlap validation / coverage warnings.**
- **Undo/redo history.**
- **Import/export JSON.**

## How to run

```bash
npm install
npm run dev
```

Then open the local preview URL (default `http://localhost:8080`).

No environment variables or backend are required for the current editor.

## Notes for AI continuation

- If you add a backend, replace `localStorage` persistence with a server function + database table while keeping the same `Saved` shape.
- If splitting the file, move the pure helpers (`clamp`, `snapVal`, `alignSnapX`, `alignSnapY`, `computeGaps`) and the `Zone`/`Settings` types into a separate module first.
- The current route is `createFileRoute("/")`. New routes go in `src/routes/...` using TanStack Router conventions.
