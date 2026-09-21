"use client";

import { useMemo, useRef, useState } from "react";
import { packageImage, price, type Package } from "@/app/_lib/tebex";
import { Cube } from "@/app/_ui/art";
import { useBasket } from "@/app/_ui/BasketProvider";
import { QTY_CATEGORIES } from "@/app/_lib/config";

const BULK = [5, 10, 25];

// Placeholder block colours, matching the accent the card is already using, so
// a package with no artwork still gets something to look at.
const BLOCKS: Record<number, [string, string, string]> = {
  1: ["#c6ff3d", "#8fc41f", "#6a9612"],
  2: ["#ff5a5f", "#c93b40", "#9c2b30"],
  3: ["#4de3ff", "#22a9c9", "#167f99"],
  4: ["#a77bff", "#7448d6", "#5631ab"],
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

export default function PackageCard({ pkg, accent }: { pkg: Package; accent: number }) {
  const { add, busy, username } = useBasket();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const info = useRef<HTMLDialogElement>(null);

  // The card says what the package *is*. The perk list, permissions and small
  // print live behind the info button — a rank description runs to a thousand
  // characters and buries the price.
  const { lead, perks, extra } = useMemo(() => parseDescription(pkg.description), [pkg.description]);

  // Tebex's Quantity Lock wins where it's set. Otherwise only categories that
  // are genuinely bought in multiples get a stepper: by default Tebex reports
  // every package as quantity-allowed, which put "x25" on lifetime ranks.
  const allowQty = !pkg.disable_quantity && QTY_CATEGORIES.some((c) => norm(c) === norm(pkg.category.name));

  const max = pkg.user_limit > 0 ? pkg.user_limit : 64;
  const img = packageImage(pkg);
  const onSale = pkg.discount > 0;
  const blocks = BLOCKS[accent] ?? BLOCKS[1];

  const set = (n: number) => setQty(Math.min(Math.max(Math.round(n) || 1, 1), max));

  async function addToBasket() {
    setError(null);
    // Offline stores need the username before Tebex will accept anything.
    if (!username) {
      document.getElementById("who")?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.querySelector<HTMLInputElement>('input[aria-label="Minecraft username"]')?.focus();
      setError("Enter your Minecraft username first — it's just above.");
      return;
    }
    try {
      await add(pkg.id, allowQty ? qty : 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that to the basket");
    }
  }

  return (
    <article className={`cl-pkg cl-neon cl-a${accent}`}>
      <div className="cl-pkg-head">
        <h3>{pkg.name}</h3>
        {onSale ? <span className="cl-badge">Sale</span> : null}
      </div>

      <figure className="cl-pkg-fig">
        {img ? (
          /* Tebex serves package art from its own CDN on domains we don't
             control, so a plain <img> avoids configuring remotePatterns. */
          <img src={img} alt="" loading="lazy" />
        ) : (
          <Cube size={84} top={blocks[0]} left={blocks[1]} right={blocks[2]} />
        )}
      </figure>

      <div className="cl-pkg-desc">
        <p className="cl-pkg-lead">{lead || pkg.name}</p>
      </div>

      <p className="cl-price">
        {onSale ? <s>{price(pkg.base_price, pkg.currency)}</s> : null}
        <span>{price(pkg.total_price * (allowQty ? qty : 1), pkg.currency)}</span>
        <span className="cl-price-note">
          {pkg.type === "subscription" ? "per month" : "one-time"}
          {allowQty && qty > 1 ? ` · ${qty} ×  ${price(pkg.total_price, pkg.currency)}` : ""}
        </span>
      </p>

      {allowQty ? (
        <div className="cl-bulk">
          {BULK.map((n) => (
            <button key={n} type="button" aria-pressed={qty === n} onClick={() => set(n)}>
              &times;{n}
            </button>
          ))}
        </div>
      ) : null}

      <div className="cl-pkg-foot">
        {allowQty ? (
          <div className="cl-qty">
            <button type="button" aria-label="Decrease quantity" onClick={() => set(qty - 1)}>
              &minus;
            </button>
            <input
              type="number"
              min={1}
              max={max}
              value={qty}
              aria-label="Quantity"
              onChange={(e) => set(Number(e.target.value))}
            />
            <button type="button" aria-label="Increase quantity" onClick={() => set(qty + 1)}>
              +
            </button>
          </div>
        ) : null}

        <button className="cl-btn" type="button" disabled={busy} onClick={addToBasket}>
          {added ? "Added" : busy ? "Adding…" : "Add to basket"}
        </button>

        {perks.length || extra ? (
          <button
            type="button"
            className="cl-info"
            aria-label={`What's included in ${pkg.name}`}
            title="What's included"
            onClick={() => info.current?.showModal()}
          >
            i
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="cl-pkg-error" role="alert">
          {error}
        </p>
      ) : null}

      {/* Native <dialog> gives focus trapping and Esc-to-close for free. */}
      <dialog ref={info} className="cl-modal" aria-label={`${pkg.name} details`}>
        <div className={`cl-modal-head cl-a${accent}`}>
          <h3>{pkg.name}</h3>
          <button type="button" onClick={() => info.current?.close()} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="cl-modal-body">
          {lead ? <p className="cl-pkg-lead">{lead}</p> : null}
          {perks.length ? (
            <>
              <h4>What&apos;s included</h4>
              <ul className="cl-modal-perks">
                {perks.map((perk) => (
                  <li key={perk.raw}>
                    {perk.label ? <b>{perk.label}:</b> : null} {perk.value}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {extra ? <p className="cl-pkg-fine">{extra}</p> : null}
        </div>

        <div className="cl-modal-foot">
          <span className="cl-modal-price">{price(pkg.total_price, pkg.currency)}</span>
          <button
            className="cl-btn"
            type="button"
            disabled={busy}
            onClick={() => {
              info.current?.close();
              void addToBasket();
            }}
          >
            Add to basket
          </button>
        </div>
      </dialog>
    </article>
  );
}

type Perk = { raw: string; label: string | null; value: string };

/**
 * Tebex descriptions are free HTML. Pull out the first paragraph as a lead and
 * the <li> items as perks, dropping the boilerplate that repeats on every
 * package (EULA notice, delivery note) into `extra`.
 *
 * A bullet written as "Label: value" is split, which is what lets the
 * comparison table line packages up against each other. Bullets without a
 * colon still work — they just compare as present/absent.
 */
export function parseDescription(html: string): { lead: string; perks: Perk[]; extra: string } {
  if (typeof document === "undefined") return { lead: "", perks: [], extra: "" };
  const el = document.createElement("div");
  el.innerHTML = html;

  const perks: Perk[] = [...el.querySelectorAll("li")].map((li) => {
    const raw = (li.textContent || "").replace(/\s+/g, " ").trim();
    const at = raw.indexOf(":");
    // Only treat it as a label if the colon comes early — "/nick for a custom
    // nickname" shouldn't be split, but "Homes: 5" should.
    if (at > 0 && at <= 28) return { raw, label: raw.slice(0, at).trim(), value: raw.slice(at + 1).trim() };
    return { raw, label: null, value: raw };
  });

  el.querySelectorAll("ul, ol").forEach((n) => n.remove());
  const paras = [...el.querySelectorAll("p")]
    .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const loose = !paras.length ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";

  return { lead: paras[0] || loose, perks, extra: paras.slice(1).join(" ") };
}
