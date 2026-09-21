"use client";

import Link from "next/link";
import { useState } from "react";
import { avatarUrl, price } from "@/app/_lib/tebex";
import { useBasket } from "@/app/_ui/BasketProvider";
import Strip from "@/app/_ui/Strip";
import Footer from "@/app/_ui/Footer";
import { SITE_URL, DISCORD } from "@/app/_lib/config";

export default function BasketPage() {
  const { basket, remove, busy, username } = useBasket();
  const [error, setError] = useState<string | null>(null);
  const [going, setGoing] = useState(false);

  const lines = basket?.packages ?? [];

  // Minecraft stores tie the purchase to a username before payment. Tebex hosts
  // that step, then sends the customer to its own checkout. We never see a card.
  function checkout() {
    if (!basket) return;
    setGoing(true);
    setError(null);
    if (basket.links.checkout) {
      window.location.href = basket.links.checkout;
      return;
    }
    setError("Tebex didn't return a checkout link. The store may still be in onboarding.");
    setGoing(false);
  }

  return (
    <>
      <Strip />
      <section className="cl-section cl-wrap">
        <h2 className="cl-head">
          Your basket<span>{lines.length}</span>
        </h2>

        {lines.length === 0 ? (
          <div className="cl-neon cl-a3 cl-empty">
            <p>Nothing in here yet.</p>
            <Link className="cl-btn" href="/">
              Browse the store
            </Link>
          </div>
        ) : (
          <div className="cl-basket">
            <div className="cl-lines">
              {lines.map((line, i) => (
                <div key={line.id} className={`cl-line cl-a${(i % 4) + 1}`}>
                  <figure className="cl-line-fig">
                    {line.image ? <img src={line.image} alt="" height={60} /> : null}
                  </figure>
                  <div>
                    <b>{line.name}</b>
                    {line.in_basket.quantity > 1 ? <small>Quantity: &times;{line.in_basket.quantity}</small> : null}
                  </div>
                  <span className="cl-line-price">
                    {price(line.in_basket.price, basket!.currency)}
                  </span>
                  <button
                    className="cl-line-rm"
                    type="button"
                    disabled={busy}
                    aria-label={`Remove ${line.name}`}
                    onClick={() => remove(line.id)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <aside className="cl-summary cl-neon cl-a1">
              <dl>
                <div className="cl-total">
                  <dt>Total</dt>
                  <dd>{price(basket!.total_price, basket!.currency)}</dd>
                </div>
              </dl>

              <button className="cl-btn" type="button" disabled={going || busy} onClick={checkout}>
                {going ? "Opening checkout…" : "Checkout"}
              </button>

              {error ? (
                <p style={{ marginTop: 14, fontSize: 14, color: "var(--coral)" }}>{error}</p>
              ) : null}

              {username ? (
                <p className="cl-basket-who">
                  <img src={avatarUrl(username, 64)} alt="" />
                  Delivering to <b>{username}</b>
                </p>
              ) : null}

              <p style={{ marginTop: 16, fontSize: 13, color: "var(--dim)" }}>
                Payment is handled by Tebex. Perks are delivered in-game within a minute of paying.
              </p>
            </aside>
          </div>
        )}
      </section>
      <Footer siteUrl={SITE_URL} discord={DISCORD} />
    </>
  );
}
