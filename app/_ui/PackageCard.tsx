"use client";

import Link from "next/link";
import { useState } from "react";
import { packageImage, price, type Package } from "@/app/_lib/tebex";
import { useBasket } from "@/app/_ui/BasketProvider";

// Whether a package can be bought in multiples comes from Tebex's own
// `disable_quantity` field — no config list to keep in sync. Crate keys get the
// stepper and the bulk chips; a rank doesn't.
const BULK = [5, 10, 25];

export default function PackageCard({ pkg, accent }: { pkg: Package; accent: number }) {
  const { add, busy } = useBasket();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const allowQty = !pkg.disable_quantity;
  const max = pkg.user_limit > 0 ? pkg.user_limit : 64;
  const img = packageImage(pkg);
  const onSale = pkg.discount > 0;

  const set = (n: number) => setQty(Math.min(Math.max(Math.round(n) || 1, 1), max));

  async function addToBasket() {
    await add(pkg.id, allowQty ? qty : 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className={`cl-pkg cl-neon cl-a${accent}`}>
      <div className="cl-pkg-top">
        {onSale ? <span className="cl-badge">&minus;{price(pkg.discount, pkg.currency)} off</span> : <span />}
      </div>

      {img ? (
        <figure className="cl-pkg-fig">
          {/* Tebex serves package art from its own CDN on domains we don't control,
              so a plain <img> avoids configuring remotePatterns for next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" loading="lazy" />
        </figure>
      ) : null}

      <h3>
        <Link href={`/package/${pkg.slug || pkg.id}`}>{pkg.name}</Link>
      </h3>

      {/* Descriptions are authored in the Tebex panel and contain markup. */}
      <div className="cl-pkg-desc" dangerouslySetInnerHTML={{ __html: pkg.description }} />

      <p className="cl-price">
        {onSale ? <s>{price(pkg.base_price, pkg.currency)}</s> : null}
        <span>{price(pkg.total_price * (allowQty ? qty : 1), pkg.currency)}</span>
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
    </article>
  );
}
