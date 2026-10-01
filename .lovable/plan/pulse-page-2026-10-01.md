# Pulse Page

## Goal
Create a desktop-first `/pulse` page that acts as the live heartbeat of the signage network, making playback activity, delivery speed, audience timing, and emerging anomalies immediately understandable.

## What will be built
- Add Pulse to the existing workspace navigation and highlight it on its page.
- Create a live signal header with time range, location filtering, search, and a streaming-status indicator.
- Lead with a distinctive network pulse visualization showing current playback volume and signal quality over time.
- Add compact operational metrics for plays, impressions, delivery latency, and screen reach.
- Show a real-time event stream for screen check-ins, content starts, completions, and interruptions.
- Add intelligent anomaly detection with clear explanations and useful browser-local actions.
- Include content and location performance views for fast comparison without turning the page into a generic analytics dashboard.

## Technical details
- Add a TanStack route at `src/routes/pulse.tsx` with unique page metadata.
- Reuse the established icon rail, semantic amber-and-teal tokens, typography, shadcn controls, and toast patterns.
- Update the shared navigation definitions in Control Centre, Layouts, and Media so Pulse links to `/pulse`.
- Keep all data and interactions as realistic in-browser demonstrations; no server storage will be added.
- Verify the route, navigation, filters, key actions, and desktop layout in the running preview.
