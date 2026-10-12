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

## Architecture rules
- Public data (settings, published vehicles) is read through server functions in src/lib/public.functions.ts using a per-request publishable client — keeps SSR/SEO working without exposing secrets.
- Admin writes go directly from the browser client; authorization is enforced by RLS via public.has_role — never trust UI checks alone.
- Images live in the private "media" bucket and are served by /api/public/media/$ — workspace blocks public buckets, and this gives stable cacheable URLs.
- The /admin area is ssr:false with an inline login gate; first admin is claimed via the claim_first_admin() RPC only while no admin exists — no hardcoded credentials.
- Site-wide editable content is a single jsonb row in site_settings (id=1), merged over DEFAULT_SETTINGS in src/lib/site.ts.
