"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCategories, categorySlug, type Category } from "@/app/_lib/tebex";

// Categories are fetched once and shared, because two things need them: the
// catalogue renders them, and the info board names the one currently selected.
// Fetching in each would mean two round trips and two sources of truth.
type Ctx = {
  categories: Category[] | null;
  error: string | null;
  selected: string; // "all" or a category slug
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
  const [selected, setSelected] = useState("all");

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((cats) => {
        if (cancelled) return;
        setCategories(cats);
        // A category can be linked directly (#c-ranks); honour it now that we
        // know which slugs exist.
        const fromHash = location.hash.startsWith("#c-") ? location.hash.slice(3) : "all";
        if (cats.some((c) => categorySlug(c) === fromHash)) setSelected(fromHash);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not reach the store"));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      history.replaceState(null, "", selected === "all" ? location.pathname : `#c-${selected}`);
    } catch {
      /* replaceState can throw in odd embedding contexts; selection still works */
    }
  }, [selected]);

  const selectedName =
    selected === "all"
      ? "Everything"
      : categories?.find((c) => categorySlug(c) === selected)?.name || "Everything";

  return (
    <StoreContext.Provider value={{ categories, error, selected, setSelected, selectedName }}>
      {children}
    </StoreContext.Provider>
  );
}
