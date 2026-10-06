# Screens workspace

## Goal
Add a desktop-first Screens workspace for monitoring the signage fleet, plus a dedicated page for each screen.

## What I’ll build
- Add `/screens` as the fleet inventory with health totals, search, location/status filters, grid/list switching, and screen cards that expose status, current content, sync freshness, and quick actions.
- Add `/screens/$screenId` as the individual screen page with a visual playback preview, live device health, current schedule/content, connectivity history, device details, and practical actions such as restart, refresh content, and edit assignment.
- Reuse the existing amber-and-teal visual system, typography, icon rail, collapsible navigation, and desktop workspace proportions.
- Connect the Screens item from Control Centre, Pulse, Media, and Layouts to the new page, with active-state highlighting.
- Keep interactions as browser-local demonstrations, matching the existing CMS pages; no cloud storage or device connection will be added.

## Technical details
- Create a shared typed demo-data module so both pages use the same screen records and statuses.
- Use top-level TanStack routes `screens.tsx` and `screens.$screenId.tsx`; unknown screen IDs show a clear unavailable state.
- Add unique page metadata for both routes.
- Verify the inventory-to-detail flow, controls, desktop rendering, console state, and build health.
