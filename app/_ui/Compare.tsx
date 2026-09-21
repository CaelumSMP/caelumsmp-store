"use client";

import { useMemo, useState } from "react";
import { price, type Package } from "@/app/_lib/tebex";

// The comparison table is built from what's already written in each package's
// description: every <li> becomes a feature row, ticked for the packages that
// list it. Nothing extra to maintain in the Tebex panel — write the perks as a
// bullet list and the table follows.
//
// Only shown when at least two packages in the category actually have bullets,
// so a crate-keys category never grows a pointless table.
function bullets(html: string): string[] {
  if (typeof document === "undefined") return [];
  const el = document.createElement("div");
  el.innerHTML = html;
  return [...el.querySelectorAll("li")].map((li) => (li.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean);
}

const ACCENTS = ["cl-a1", "cl-a2", "cl-a3", "cl-a4"];

export default function Compare({ packages }: { packages: Package[] }) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const order: string[] = [];
    const seen = new Map<string, Set<number>>();
    packages.forEach((p, i) => {
      for (const b of bullets(p.description)) {
        const key = b.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, new Set());
          order.push(b);
        }
        seen.get(key)!.add(i);
      }
    });
    return order.map((label) => ({ label, has: seen.get(label.toLowerCase())! }));
  }, [packages]);

  if (packages.length < 2 || rows.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className="cl-btn cl-btn-ghost cl-a3"
        aria-pressed={open}
        onClick={() => setOpen(!open)}
        style={{ marginBottom: 26 }}
      >
        Compare tiers
      </button>

      {open ? (
        <div className="cl-compare-wrap">
          <table className="cl-compare">
            <thead>
              <tr>
                <th />
                {packages.map((p, i) => (
                  <th key={p.id} scope="col" className={ACCENTS[i % 4]}>
                    <span className="cl-compare-name">{p.name}</span>
                    <span className="cl-compare-price">{price(p.total_price, p.currency)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {packages.map((p, i) => (
                    <td key={p.id}>
                      {row.has.has(i) ? (
                        <span className="cl-yes" role="img" aria-label="Included">
                          &#10003;
                        </span>
                      ) : (
                        <span className="cl-no" role="img" aria-label="Not included">
                          &#8212;
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
