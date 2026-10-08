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

- Use Framer Motion for PookieDoll's visible motion states and face overlays because those animations need synchronized spring transitions.
- Serve branding images from lowercase PNG files in public using absolute root paths so references remain portable across production hosts.
- PookieDoll owns browser speech selection, lifecycle, and cooldown; the converter emits a completion event and marks its upload target so file processing remains independent of character audio.
- Keep TanStack file routes as thin wrappers around the shared ConverterWorkspace; leaf routes own tool metadata and initial tool selection so direct visits and client navigation agree.
- Load Word conversion packages only inside browser conversion handlers; DOCX import sanitizes document HTML and PDF export runs locally without server credentials.
- Render DOCX HTML in an isolated off-screen document before PDF rasterization to avoid application CSS incompatibilities; Word-to-PDF preserves visual content rather than selectable PDF text.
- Use the Button workspace variant and size for existing converter controls so design-system adoption preserves their established dimensions and appearance.
