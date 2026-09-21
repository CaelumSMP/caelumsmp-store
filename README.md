# caelum-web-tebex

The CaelumSMP store: a Next.js front end on the **Tebex Headless API**, styled to
match `../caelum-web-fable`. Packages, prices, descriptions and artwork all come
from the Tebex panel; payment and fulfilment stay with Tebex.

```sh
npm install
npm run dev     # http://localhost:3001
```

## Why not a Tebex-hosted theme

Tebex replaced its template system. New stores get the **Webstore Builder** — a
fixed set of drag-and-drop blocks with a colour/font/radius panel. Their docs are
explicit:

> "If you've recently created a store and are wanting to use our Legacy Webstore
> template & theme options, this is unavailable."
> — [Storefronts](https://docs.tebex.io/creators/tebex-control-panel/storefronts)

> "Full HTML & CSS Editing is currently unavailable on new stores using our new
> storefronts system" … "we're working on bringing this functionality back soon"
> — [Appearance](https://docs.tebex.io/creators/tebex-control-panel/webstore/appearance)

So the Twig theme in `legacy-twig/` cannot be installed on this store, and a
BuiltByBit Twig theme couldn't be either. Headless sidesteps the whole split:
it doesn't care which storefront system the account is on, and it needs no Plus
subscription — the free Starter plan is enough.

## Hosting — Cloudflare Pages

Every route is a **static export** (`output: "export"`), which is the whole point:
Cloudflare Pages serves static assets with [unlimited bandwidth and unlimited
requests on the free plan](https://developers.cloudflare.com/pages/functions/pricing/).
Only Pages *Functions* are metered, and this site has none — so there is no
traffic level at which it starts costing money.

**Don't use Vercel.** Its Hobby plan
[prohibits commercial use](https://vercel.com/docs/plans/hobby) and caps transfer
at 100GB, pausing the project when exceeded. A store is commercial by definition.

**No nameserver change needed.** `store.caelumsmp.net` is a subdomain, so add it
as a custom domain in the Pages dashboard first, then point a CNAME at
`<site>.pages.dev` from the existing DNS provider. Only an apex domain would
require moving nameservers. Cloudflare's DDoS protection applies either way,
which covers what Tebex hosting used to provide.

Because the catalogue is fetched in the browser, adding a package in the Tebex
panel appears immediately — no rebuild, no redeploy.

## Layout

```
app/
  _lib/tebex.ts        Headless API client — the only place endpoints live
  _lib/config.ts       server IP, Discord, site URL (things Tebex has no field for)
  _ui/BasketProvider   basket state; persists only the basket ident
  _ui/PackageCard      one package: art, perks, price, quantity, add to basket
  _ui/CategoryRail     instant client-side category filter
  _ui/Strip, Footer, art
  page.tsx             store front
  category/[slug]      one category
  package/[slug]       one package
  basket               basket + checkout handoff
  globals.css          the Aurora design system

legacy-twig/           the Twig theme, kept for if Tebex re-enables custom templates
```

## Design

Follows `../caelum-web-fable/DESIGN.md` — aurora gradient, pixel-notched cards,
Rubik Mono One headings, hard shadows, accents cycling lime → coral → cyan →
violet. Three deliberate deviations, because a store isn't an event poster:

- **Prices and buttons are Space Grotesk 700, not Rubik Mono One.** A heavy
  display face on every control reads arcade rather than premium.
- **No skew on badges or chips.** The notch is the signature; three textures at
  once is too loud.
- **Hard shadows only on the hero headline and the footer line.**

## Notes for whoever works on this next

**The public token is meant to be public.** Tebex says it "is allowed to be
shared publicly", which is why it's `NEXT_PUBLIC_` and the browser calls Tebex
directly. The private key is never used — nothing this store does needs it. Don't
add route handlers to "hide" the token; they'd add a hop for nothing.

**Quantity comes from Tebex, not a config list.** `disable_quantity` on the
package decides whether a card gets the stepper and the ×5/×10/×25 chips, so crate
keys behave correctly without anything to keep in sync.

**Nothing is cached.** Prices and sale state must be current and the traffic is
small. If that changes, the fix is `use cache` + `cacheLife` with
`cacheComponents: true` in `next.config.ts` — Next 16 no longer caches `fetch` by
default.

## Not built yet

- **Coupons and gift cards.** Endpoints exist; add them when there's a sale to run.
- **Package options / variables.** Packages needing input before purchase aren't
  handled; the card adds straight to the basket.
- **Basket login is blocked by store setup.** Minecraft stores require the
  customer's username on the basket *before packages can be added* — an add
  without it fails `422 "User must login before adding packages to basket"`. The
  code handles this: it stashes what was being added, sends the customer to
  Tebex's login, and replays the add on return. It is **untested**, because
  `/baskets/{ident}/auth` currently returns an empty option set — this store has
  no login method configured while its onboarding is incomplete. Re-test once the
  Tebex setup checklist is finished.

## API gotcha worth knowing

The Headless docs are inconsistent about paths, and a wrong one returns an HTML
404 page rather than a JSON error. Verified against the live API:

| Operation | Path |
|---|---|
| categories, create basket, get basket, auth | `/api/accounts/{token}/…` |
| add / remove packages | `/api/baskets/{ident}/…` — **no token** |

`app/_lib/tebex.ts` keeps these as two separate base helpers so the distinction
is visible rather than buried in string concatenation.

## Deploying (Coolify)

This is a **static export**: `npm run build` writes plain HTML/CSS/JS to `out/`.
Nothing here needs a Node process at runtime, so point Coolify at `out/` with a
static service (nginx/Caddy) rather than running `next start`.

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run build` |
| Output directory | `out` |
| Runtime | static — no server needed |

Set **`NEXT_PUBLIC_TEBEX_TOKEN`** in Coolify's environment variables. It's baked
into the bundle at build time, so changing it needs a rebuild, not just a
restart. `.env.local` is gitignored and never leaves your machine.

Because the catalogue is fetched in the browser, packages added in the Tebex
panel appear without redeploying — only chrome changes (`config.ts`, styling)
need a new build.
