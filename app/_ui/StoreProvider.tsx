"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCategories, categorySlug, type Category } from "@/app/_lib/tebex";

// Categories are fetched once and shared, because two things need them: the
// catalogue renders them, and the info board names the one currently selected.
// Fetching in each would mean two round trips and two sources of truth.
type Ctx = {
  categories: Category[] | null;
  error: string | null;
  /** Always a real category slug — there is no "everything" view. */
  selected: string;
  setSelected: (slug: string) => void;
  selectedName: string;
};

const StoreContext = createContext<Ctx | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((cats) => {
        if (cancelled) return;
        setCategories(cats);
        // A category can be linked directly (#c-ranks); otherwise open on the
        // first one, so the store always shows packages rather than a wall of
        // every category at once.
        const fromHash = location.hash.startsWith("#c-") ? location.hash.slice(3) : "";
        const valid = cats.some((c) => categorySlug(c) === fromHash);
        setSelected(valid ? fromHash : cats[0] ? categorySlug(cats[0]) : "");
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not reach the store"));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    try {
      history.replaceState(null, "", `#c-${selected}`);
    } catch {
      /* replaceState can throw in odd embedding contexts; selection still works */
    }
  }, [selected]);

  const selectedName = categories?.find((c) => categorySlug(c) === selected)?.name || "…";

  return (
    <StoreContext.Provider value={{ categories, error, selected, setSelected, selectedName }}>
      {children}
    </StoreContext.Provider>
  );
}
