"use client";

import { useRef } from "react";
import { NAV, SITE_URL, SERVER_IP, SOCIALS } from "@/app/_lib/config";

// Full-screen block menu, ported from ../caelum-web-fable/app/(site)/Menu.tsx.
// Native <dialog> gives focus trapping and Esc-to-close for free.
export default function Menu() {
  const ref = useRef<HTMLDialogElement>(null);
  const all: [string, string][] = [
    [SITE_URL, "Home"],
    ...NAV.map(([href, label]) => [`${SITE_URL}${href}`, label] as [string, string]),
    ["/", "Store"],
  ];

  function copyIp() {
    navigator.clipboard.writeText(SERVER_IP);
  }

  return (
    <>
      <button type="button" className="cl-menu-btn" onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
        <span aria-hidden className="cl-burger" />
        Menu
      </button>

      <dialog ref={ref} className="cl-menu" aria-label="Site menu">
        <button type="button" className="cl-menu-btn" onClick={() => ref.current?.close()}>
          ✕ Close
        </button>

        <ol>
          {all.map(([href, label], n) => (
            <li key={href}>
              <a href={href} onClick={() => ref.current?.close()}>
                <span>{String(n + 1).padStart(2, "0")}</span>
                {label}
              </a>
            </li>
          ))}
        </ol>

        <div className="cl-menu-foot">
          <button type="button" className="cl-btn" onClick={copyIp}>
            Copy IP
          </button>
          <a href={SITE_URL} className="cl-btn">
            Main site
          </a>
          <ul>
            {SOCIALS.map((x) => (
              <li key={x.label}>
                <a href={x.href} target="_blank" rel="noopener noreferrer">
                  {x.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
