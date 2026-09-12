# Media Library Page

## Goal
Create a desktop media-management page that feels like part of the existing signage workspace, using the same sidebar, amber/teal palette, typography, spacing, and compact controls.

## What will be built
- Add a `/media` page with the shared icon-rail and expandable navigation; Media is highlighted and Layouts links back to `/layouts`.
- Add a media header with search, grid/list view controls, filtering, and an upload action.
- Show a useful seeded media library with image and video previews, file details, duration or dimensions, selection states, and item menus.
- Add a media-specific folder section in the sidebar with folder creation and filtering.
- Add a right-side details panel for the selected item with preview, metadata, usage, rename, download, and delete actions.
- Keep all demo interactions browser-local; no account, server storage, or upload service will be added.

## Technical details
- Use a new TanStack route at `src/routes/media.tsx` with unique page metadata.
- Reuse existing shadcn controls, Lucide icons, semantic color tokens, and the current Space Grotesk / DM Sans type system.
- Update the layouts navigation so its Media item opens `/media`, while preserving the current layout folder behavior.
- Verify the page at desktop and narrower browser widths, including navigation, filtering, selection, and the visible details panel.
