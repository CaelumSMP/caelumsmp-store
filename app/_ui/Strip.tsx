"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cube, Icon } from "@/app/_ui/art";
import Menu from "@/app/_ui/Menu";
import { useBasket } from "@/app/_ui/BasketProvider";
import { getStatus, fmt, type Status } from "@/app/_lib/status";
import { NAV, SITE_URL, SERVER_IP, DISCORD } from "@/app/_lib/config";

// A port of the main site's top strip, so crossing from caelumsmp.net to the
// store reads as the same site rather than a different one. Same structure,
// same sizes, same breakpoints — see the "Shared header" block in globals.css.
//
// The only differences are the two things the store genuinely owns: the coral
// chip points home instead of here, and the basket sits beside it.
export default function Strip() {
  const { count } = useBasket();
  const [status, setStatus] = useState<Status | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getStatus().then((s) => !cancelled && setStatus(s));
    return () => {
      cancelled = true;
    };
  }, []);

  function copyIp() {
    navigator.clipboard.writeText(SERVER_IP).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  const offline = status !== null && status.online === null;

  return (
    <header className="cl-strip">
      <a className="cl-brand" href={SITE_URL}>
        <Cube size={30} top="#c6ff3d" left="#8fc41f" right="#6a9612" />
        CAELUM
      </a>

      <nav className="cl-nav" aria-label="Main">
        {NAV.map(([href, label]) => (
          <a key={href} href={`${SITE_URL}${href}`}>
            {label}
          </a>
        ))}
      </nav>

      <div className="cl-pills">
        <span className="cl-pill">
          <i className="cl-dot" data-off={offline || undefined} />
          <b>{fmt(status?.online ?? null)}</b>
          <span className="cl-pill-label">playing</span>
          <button type="button" className="cl-pill-btn" onClick={copyIp}>
            {copied ? "Copied!" : "Copy IP"}
          </button>
        </span>

        <span className="cl-pill cl-pill-discord">
          <Icon name="discord" size={16} />
          <b>{fmt(status?.discord ?? null)}</b>
          <span className="cl-pill-label">on Discord</span>
          {DISCORD ? (
            <a className="cl-pill-btn" href={DISCORD} target="_blank" rel="noopener noreferrer">
              Join
            </a>
          ) : null}
        </span>
      </div>

      {/* On the main site this chip brings you here; here it takes you back. */}
      <a className="cl-store-chip" href={SITE_URL}>
        <Icon name="chest" size={16} />
        Main site
      </a>

      <Link className="cl-basket-btn" href="/basket">
        Basket
        <i>{count}</i>
      </Link>

      <Menu />
    </header>
  );
}
