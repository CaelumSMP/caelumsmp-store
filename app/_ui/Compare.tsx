"use client";

import { useMemo, useState } from "react";
import { price, type Package } from "@/app/_lib/tebex";
import { parseDescription } from "@/app/_ui/PackageCard";

// A tier table built from the package descriptions.
//
// The first version ticked a box when two packages shared an identical bullet.
// That is useless for ranks, because every tier words its perks differently —
// "3 particle trails" vs "10 particle trails plus arrow trails" are different
// strings, so nothing ever lined up and every row had a single tick.
//
// Instead this groups on the label in a "Label: value" bullet and prints each
// tier's value, which is what makes tiers actually comparable. Bullets with no
// label fall back to present/absent, so nothing is lost by not adopting the
// convention everywhere.
const ACCENTS = ["cl-a1", "cl-a2", "cl-a3", "cl-a4"];

export default function Compare({ packages }: { packages: Package[] }) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const order: string[] = [];
    const byLabel = new Map<string, Map<number, string>>();

    packages.forEach((p, i) => {
      for (const perk of parseDescription(p.description).perks) {
        const key = (perk.label ?? perk.value).toLowerCase();
        if (!byLabel.has(key)) {
          byLabel.set(key, new Map());
          order.push(perk.label ?? perk.value);
        }
        byLabel.get(key)!.set(i, perk.label ? perk.value : "yes");
      }
    });

    return order
      .map((label) => ({ label, values: byLabel.get(label.toLowerCase())! }))
      // A row only earns its place if more than one tier says something about
      // it, or it carries a real value rather than a bare tick.
      .filter((r) => r.values.size > 1 || [...r.values.values()].some((v) => v !== "yes"));
  }, [packages]);

  if (packages.length < 2 || rows.length === 0) return null;

  return (
    <div className="cl-compare-block">
      <button
        type="button"
        className="cl-btn cl-btn-ghost cl-a3"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide comparison" : `Compare all ${packages.length} tiers`}
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
                  {packages.map((p, i) => {
                    const v = row.values.get(i);
                    if (v === undefined)
                      return (
                        <td key={p.id}>
                          <span className="cl-no" role="img" aria-label="Not included">
                            &#8212;
                          </span>
                        </td>
                      );
                    if (v === "yes")
                      return (
                        <td key={p.id}>
                          <span className="cl-yes" role="img" aria-label="Included">
                            &#10003;
                          </span>
                        </td>
                      );
                    return (
                      <td key={p.id} className="cl-compare-value">
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
