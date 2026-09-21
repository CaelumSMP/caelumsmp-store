"use client";

import { categorySlug } from "@/app/_lib/tebex";
import { useStore } from "@/app/_ui/StoreProvider";

// Filters the catalogue in place rather than navigating, so switching is
// instant. The selection lives in StoreProvider because the info board shows it
// too, and the hash keeps a filtered view shareable.
export default function CategoryRail() {
  const { categories, selected, setSelected } = useStore();
  if (!categories || categories.length < 2) return null;

  return (
    <div className="cl-rail cl-a1">
      <button type="button" aria-pressed={selected === "all"} onClick={() => setSelected("all")}>
        Everything
      </button>
      {categories.map((c) => {
        const slug = categorySlug(c);
        return (
          <button key={c.id} type="button" aria-pressed={selected === slug} onClick={() => setSelected(slug)}>
            {c.name} <em>{c.packages.length}</em>
          </button>
        );
      })}
    </div>
  );
}
