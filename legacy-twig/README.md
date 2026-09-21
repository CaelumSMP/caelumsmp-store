# caelum-web-tebex

Custom Tebex store template for CaelumSMP, in the same D4 "Aurora Fest" style as
`../caelum-web-fable`. Design source of truth is `../caelum-web-fable/DESIGN.md`.

Plain Twig + CSS + one vanilla JS file. No build step, no dependencies — the files
in here are uploaded to the Tebex panel as-is.

## Layout

```
pages/       -> Webstore > Appearance > (your template) > Pages
  layout.html      the shell every page extends
  index.html       store front: hero, board, most-popular, rail, categories + sidebar, trust
  category.html    one category
  package.html     one package in detail
  checkout.html    basket + Tebex.js handoff
  username.html    who we're delivering to
  options.html     packages that need input first
  cms-page.html    custom pages  ** upload as `cms/page.html` **
  module.*.html    the five sidebar modules (payments, topdonator, goal,
                   communitygoal, serverstatus) - enable and order them in the
                   panel under Storefront; layout prints them via {{ modules|raw }}

assets/      -> same editor, Assets tab
  theme.css          the whole design system
  store.js           quantity stepper, category filter, comparison table, parallax
  package-card.twig  one package tile (index + category)
  add-to-basket.twig the add form  ** holds the one unverified route **
  cube.twig          the isometric brand block

schema.json  -> the template's config schema (panel settings, no code)
test.html    -> local preview + self-check
```

## Previewing locally

`test.html` holds fixture markup matching what the Twig renders, so you can work on
`theme.css` and `store.js` without touching the panel. It must be served over HTTP,
not opened as a `file://` path:

```sh
python -m http.server 8731 --bind 127.0.0.1
# then open http://127.0.0.1:8731/test.html
```

The panel in the bottom-left runs 12 checks against `store.js` — the comparison
table's rows and ticks, the quantity stepper's clamping and live total, and the
category filter. It turns red and says how many failed if any do.

## Installing

1. Panel → **Webstore → Appearance**, create a custom template based on **Exo**.
2. Upload everything in `assets/` on the Assets tab.
3. Paste each file from `pages/` into the matching page. `cms-page.html` goes into
   the page named `cms/page.html`.
4. Paste `schema.json` into the schema editor, then fill the settings it adds
   (server IP, Discord, headline, quantity categories).
5. Preview, then turn on **Test Mode** in Checkout Settings and buy something.

## Before you trust it: one route to check

Tebex documents the template variables but **not** the webstore's basket routes, so
two form actions here are the classic Buycraft/Tebex routes rather than something I
could confirm from the docs:

| File | Line | Action |
|---|---|---|
| `assets/add-to-basket.twig` | the `<form>` | `/checkout/packages/add/{id}/single` |
| `pages/checkout.html` | the remove `<form>` | `/checkout/packages/remove/{id}` |

Open the stock Exo template in the panel, find its add-to-basket and remove forms,
and copy the real `action` values across. Each URL appears exactly once, so it's a
one-line fix per file if they differ. `pages/options.html` has the same caveat on
two field *names* (custom price, choose server), marked `FIELD CHECK` in the file.

Everything else — variables, filters, `asset()`, `config()`, `__()`, Tebex.js — comes
straight from the docs.

## Design: where this deviates from DESIGN.md

`DESIGN.md` describes an event poster. A store has a different job, so three things
are deliberately toned down here. Keep them in sync if you revisit:

- **Prices and buttons use Space Grotesk 700, not Rubik Mono One.** A heavy display
  face on every price and button reads arcade rather than premium. Rubik Mono One is
  still the brand, the hero, section heads, card titles and the footer.
- **No skew on badges, kickers or chips.** The pixel notch is the signature; three
  textures at once is what made it loud.
- **Hard 6px shadows only on the hero headline and the footer line**, not everywhere.

Everything else - palette, the notch, the accent cycle, the aurora gradient - is
unchanged from the spec.

## Panel settings

Everything writable lives in `schema.json`, so the copy is editable from the panel
with no code change: Server (IP, Discord, main site), Hero (kicker, headline,
intro), Merchandising (most-popular row, the two ribbons, quantity categories) and
Trust (delivery time and the three trust panels).

Package names, descriptions, prices and images come from Tebex's own Packages
section as normal. The homepage intro can also be set under Storefront > Pages,
which takes priority over the `hero-lede` setting.

The merchandising settings match on package or category **name**, ignoring case and
spaces. Rename a package in the panel and you must update the setting too.

## The store front, top to bottom

Short hero, info board, **Most popular** packages, category rail, then the
categories in a two-column layout with a social-proof sidebar, then the trust
panels. The order is deliberate: something buyable is on screen before any
scrolling, which is what every top store does and the previous full-screen hero
did not.

## The three extras

**Quantity stepper.** For crate keys and anything else bought in multiples. Which
categories get it is a panel setting (`qty-categories`), not a guess at an
undocumented field — set it to `Crate Keys, Consumables` and those packages get
−/+ controls, `×5 ×10 ×25` shortcuts, and a price that updates as you change it.
Everything else keeps a plain Add to basket button.

**Category selector.** A sticky notched rail under the header. On the store front it
filters the sections already rendered, so switching categories is instant with no page
load; the hash keeps it linkable (`#c-ranks`). With JS off the `<noscript>` rail gives
real links to the category pages, and `category.html` renders the same rail as links.

**Comparison table.** Built from what you already write. Put each package's perks in
the description as a bullet list; the table unions the `<li>` items across a category,
one row each, ticked where present. Nothing extra to maintain in the panel, and it
only appears when a category has 2+ packages that actually have bullets — the
**Compare tiers** button stays hidden otherwise.

So for ranks, write descriptions like:

```html
<ul>
  <li>Coloured name tag</li>
  <li>/fly in the hub</li>
  <li>3 home slots</li>
</ul>
```

and the table follows automatically.

## Deliberately not built

- **Coupon / gift-card box on the basket.** Same undocumented-route problem, and
  it's dead weight until you actually run a sale. Add it when you do.
- **Currency / language selector.** Every large store has one; Tebex handles the
  conversion, but the switcher is extra template work. Worth adding before launch.
- **Illustrated category art.** The rail is text. ManaCube-style art tiles look far
  better but need six pieces of artwork first.
- **Local Twig rendering.** `test.html` covers the CSS and JS against fixture markup;
  the panel's own preview covers the Twig. A local Twig runner would mean PHP or a
  Twig-in-JS dependency to catch what the preview catches for free.
