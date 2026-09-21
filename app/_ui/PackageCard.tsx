"use client";

import { useState } from "react";
import { packageImage, price, type Package } from "@/app/_lib/tebex";
import { Cube } from "@/app/_ui/art";
import { useBasket } from "@/app/_ui/BasketProvider";

// Whether a package can be bought in multiples comes from Tebex's own
// `disable_quantity` field — no config list to keep in sync. Crate keys get the
// stepper and the bulk chips; a rank doesn't.
const BULK = [5, 10, 25];

// Placeholder block colours, matching the accent the card is already using, so
// a package with no artwork still gets something to look at.
const BLOCKS: Record<number, [string, string, string]> = {
  1: ["#c6ff3d", "#8fc41f", "#6a9612"],
  2: ["#ff5a5f", "#c93b40", "#9c2b30"],
  3: ["#4de3ff", "#22a9c9", "#167f99"],
  4: ["#a77bff", "#7448d6", "#5631ab"],
};

export default function PackageCard({ pkg, accent }: { pkg: Package; accent: number }) {
  const { add, busy } = useBasket();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowQty = !pkg.disable_quantity;
  const max = pkg.user_limit > 0 ? pkg.user_limit : 64;
  const img = packageImage(pkg);
  const onSale = pkg.discount > 0;
  const blocks = BLOCKS[accent] ?? BLOCKS[1];

  const set = (n: number) => setQty(Math.min(Math.max(Math.round(n) || 1, 1), max));

  async function addToBasket() {
    setError(null);
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

      {/* Descriptions are authored in the Tebex panel and contain markup. */}
      <div className="cl-pkg-desc" dangerouslySetInnerHTML={{ __html: pkg.description }} />

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
      </div>

      {error ? (
        <p className="cl-pkg-error" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}
