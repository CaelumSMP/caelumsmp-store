"use client";

import Link from "next/link";
import { Cube } from "@/app/_ui/art";
import { useBasket } from "@/app/_ui/BasketProvider";
import { NAV, SITE_URL } from "@/app/_lib/config";

// Mirrors the main site's top strip so the store doesn't feel like a different
// website. The brand and the nav links leave for caelumsmp.net; only the basket
// stays here.
export default function Strip() {
  const { count } = useBasket();
  return (
    <header className="cl-strip">
      <a className="cl-brand" href={SITE_URL}>
        <Cube size={30} top="#c6ff3d" left="#8fc41f" right="#6a9612" />
        CAELUM
      </a>

      <nav aria-label="Main">
        {NAV.map(([href, label]) => (
          <a key={href} href={`${SITE_URL}${href}`}>
            {label}
          </a>
        ))}
      </nav>

      <div className="cl-strip-right">
        <Link className="cl-store-link" href="/">
          Store
        </Link>
        <Link className="cl-basket-btn" href="/basket">
          Basket
          <i>{count}</i>
        </Link>
      </div>
    </header>
  );
}
