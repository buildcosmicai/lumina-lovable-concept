<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep each major CMS workspace module as its own top-level TanStack route so navigation remains type-safe, shareable, and independently testable.
- Help articles share a client-safe typed catalogue for search, topic collections and dedicated article routes; documentation explicitly distinguishes demo workflows from connected services to avoid claiming unsupported platform capabilities.
- AI assistant pages use route-derived conversation IDs, AI Elements and account-owned UIMessage arrays; authenticated server boundaries authorize every read and streamed write so histories cannot cross accounts.
- Screen inventory and detail pages share typed demo records from a client-safe library so status and assignments stay consistent across routes.
- Meeting-room zones store optional calendar configuration on the existing zone payload; shared client-safe meeting data and display modules keep editor previews and library templates consistent without breaking older layouts.
- Futuristic meeting-room styles use a dedicated display module routed through the shared meeting-room display, so library thumbnails and editor previews render the same calendar and privacy state.
- Photo-free instrument meeting-room styles share a dedicated display module with data-driven SVG gauges, so status and time visuals remain consistent across the library and editor.
- Adaptive meeting-room displays derive their visual phase from shared calendar state; library simulations reuse the same display so editor and preview transitions stay consistent.
- Customer room photos use owner-scoped private Cloud Storage paths keyed by room in zone configuration; shared image rendering renews signed URLs rather than persisting expiring URLs or image bytes in layouts.
- Settings uses nested TanStack layouts with an integrations module so setup pages remain independently shareable.
- Room connection metadata is owner-scoped through RLS; credentials live encrypted in a server-only table and provider access runs in authenticated server functions, preventing browser or cross-account credential reads.
- Room-viewer proposals use standalone sample routes and shared client-safe agenda records, keeping approval previews isolated from existing editor templates.
- Approved room-viewer designs use the shared meeting-state display in the library and editor; their timetable dialogs reuse the selected room's events and privacy settings to avoid unrelated sample agendas.
