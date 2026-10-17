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
- Screen inventory and detail pages share typed demo records from a client-safe library so status and assignments stay consistent across routes.
- Meeting-room zones store optional calendar configuration on the existing zone payload; shared client-safe meeting data and display modules keep editor previews and library templates consistent without breaking older layouts.
- Futuristic meeting-room styles use a dedicated display module routed through the shared meeting-room display, so library thumbnails and editor previews render the same calendar and privacy state.
- Photo-free instrument meeting-room styles share a dedicated display module with data-driven SVG gauges, so status and time visuals remain consistent across the library and editor.
