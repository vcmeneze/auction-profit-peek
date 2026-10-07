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

## Rules
- All financial assumptions and verdict thresholds live in src/lib/calc.ts — one source for cards, simulation, reports and PDF.
- Data access goes through src/lib/data.ts using the user's existing Supabase schema (imovel_caixa, simulacao); it falls back to demo data when VITE_SUPABASE_URL/key are absent so the UI always works.
