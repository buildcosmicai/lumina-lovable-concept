# Intelligent Control Centre

## Goal
Create a desktop-first `/control-center` page that gives signage operators an immediate, intelligent view of network health, active content, urgent issues, and recommended actions while matching the existing amber-and-teal workspace.

## What will be built
- Add the Control Centre to the existing icon-rail navigation and make it the active destination on its page.
- Create a concise command header with workspace status, time range, search, and a primary quick action.
- Lead with a live operational summary: screen health, active campaigns, scheduled changes, and storage status.
- Add an “Attention queue” that prioritizes offline screens, expiring content, and scheduling conflicts with clear actions.
- Add an intelligent recommendation panel that explains useful next steps and lets the operator apply or dismiss suggestions.
- Include a visual network activity timeline and a compact upcoming schedule so the page feels operational rather than like a generic analytics dashboard.
- Keep interactions as realistic browser-local demos; no account or server storage will be introduced.

## Technical details
- Add a TanStack route at `src/routes/control-center.tsx` with unique page metadata.
- Reuse the existing shadcn controls, Lucide icons, semantic design tokens, and Space Grotesk / DM Sans typography.
- Update Control Center links in `/layouts` and `/media` to point to the new route.
- Keep the layout desktop-first, with graceful horizontal constraints for narrower browser widths.
- Verify the route, navigation, core interactions, and visual hierarchy in the browser.
