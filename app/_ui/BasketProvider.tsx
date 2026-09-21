"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { addPackage, createBasket, getBasket, removePackage, type Basket } from "@/app/_lib/tebex";

// The basket ident is the only thing we persist. Everything else is re-fetched
// from Tebex, so the browser never holds a stale price or line total.
//
// ponytail: localStorage, so a basket doesn't follow the customer between
// devices. Tebex has no anonymous cross-device basket either; if that's ever
// wanted it needs accounts, which this store doesn't have.
const KEY = "caelum.basket";
const NAME_KEY = "caelum.username";

type Ctx = {
  basket: Basket | null;
  count: number;
  busy: boolean;
  /** Who the perks get delivered to. Null until they tell us. */
  username: string | null;
  setUsername: (name: string) => void;
  /** Forget who it's for and drop the basket with it. */
  clearUsername: () => void;
  add: (packageId: number, quantity: number) => Promise<void>;
  remove: (packageId: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const BasketContext = createContext<Ctx | null>(null);

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used inside <BasketProvider>");
  return ctx;
}

// Called straight from the browser. Tebex's Headless endpoints send permissive
// CORS headers and the public token is documented as safe to expose, so
// proxying these through route handlers would add files and a hop for nothing.

// Storage access is wrapped everywhere: it throws in private windows and with
// site data blocked, and the store must still work without it.
function readIdent(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function writeIdent(id: string | null) {
  try {
    if (id === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, id);
  } catch {}
}
function readName(): string | null {
  try {
    return localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

export default function BasketProvider({ children }: { children: React.ReactNode }) {
  const [basket, setBasket] = useState<Basket | null>(null);
  const [busy, setBusy] = useState(false);
  const [username, setName] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    try {
      setBasket(await getBasket(id));
    } catch {
      // Tebex expires baskets; a dead ident should not wedge the store.
      writeIdent(null);
      setBasket(null);
    }
  }, []);

  // Restore a previous basket on mount. Inlined rather than calling load() so
  // nothing is set synchronously during the effect, and cancellable so a fast
  // unmount can't set state on a dead component.
  useEffect(() => {
    const saved = readIdent();
    const savedName = readName();
    let cancelled = false;
    if (savedName) queueMicrotask(() => !cancelled && setName(savedName));
    if (!saved) return () => { cancelled = true; };
    (async () => {
      try {
        const b = await getBasket(saved);
        if (!cancelled) setBasket(b);
      } catch {
        // Tebex expires baskets; a dead ident should not wedge the store.
        writeIdent(null);
        if (!cancelled) setBasket(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Changing who it's for starts a fresh basket — Tebex ties one to the other. */
  const setUsername = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    try {
      localStorage.setItem(NAME_KEY, clean);
    } catch {}
    setName(clean);
    if (basket && basket.username !== clean) {
      writeIdent(null);
      setBasket(null);
    }
  }, [basket]);

  const clearUsername = useCallback(() => {
    try {
      localStorage.removeItem(NAME_KEY);
    } catch {}
    setName(null);
    // The basket is tied to the username at Tebex, so it goes too.
    writeIdent(null);
    setBasket(null);
  }, []);

  const ensure = useCallback(async () => {
    const existing = basket?.ident ?? readIdent();
    if (existing) return existing;
    const name = username ?? readName();
    if (!name) throw new Error("NO_USERNAME");
    const b = await createBasket(window.location.origin, name);
    writeIdent(b.ident);
    setBasket(b);
    return b.ident;
  }, [basket?.ident, username]);

  const add = useCallback(
    async (packageId: number, quantity: number) => {
      setBusy(true);
      try {
        const id = await ensure();
        setBasket(await addPackage(id, packageId, quantity));
      } finally {
        setBusy(false);
      }
    },
    [ensure],
  );

  const remove = useCallback(
    async (packageId: number) => {
      const id = basket?.ident;
      if (!id) return;
      setBusy(true);
      try {
        setBasket(await removePackage(id, packageId));
      } finally {
        setBusy(false);
      }
    },
    [basket?.ident],
  );

  const refresh = useCallback(async () => {
    const id = basket?.ident;
    if (id) await load(id);
  }, [basket?.ident, load]);

  const count = basket?.packages.reduce((n, p) => n + (p.in_basket?.quantity || 0), 0) ?? 0;

  return (
    <BasketContext.Provider value={{ basket, count, busy, username, setUsername, clearUsername, add, remove, refresh }}>{children}</BasketContext.Provider>
  );
}
