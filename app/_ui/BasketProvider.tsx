"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { addPackage, createBasket, getAuthUrl, getBasket, removePackage, type Basket } from "@/app/_lib/tebex";

// The basket ident is the only thing we persist. Everything else is re-fetched
// from Tebex, so the browser never holds a stale price or line total.
//
// ponytail: localStorage, so a basket doesn't follow the customer between
// devices. Tebex has no anonymous cross-device basket either; if that's ever
// wanted it needs accounts, which this store doesn't have.
const KEY = "caelum.basket";
// What the customer was adding when we bounced them to Tebex to link their
// Minecraft username. Replayed when they come back.
const PENDING = "caelum.pending";

type Ctx = {
  basket: Basket | null;
  count: number;
  busy: boolean;
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

export default function BasketProvider({ children }: { children: React.ReactNode }) {
  const [ident, setIdent] = useState<string | null>(null);
  const [basket, setBasket] = useState<Basket | null>(null);
  const [busy, setBusy] = useState(false);

  // Read the stored ident once on mount. Wrapped because storage throws in
  // private windows and with site data blocked.
  useEffect(() => {
    try {
      setIdent(localStorage.getItem(KEY));
    } catch {
      /* no storage — the basket just won't survive a reload */
    }
  }, []);

  const load = useCallback(async (id: string) => {
    try {
      setBasket(await getBasket(id));
    } catch {
      // Tebex expires baskets; a dead ident should not wedge the store.
      try {
        localStorage.removeItem(KEY);
      } catch {}
      setIdent(null);
      setBasket(null);
    }
  }, []);

  useEffect(() => {
    if (ident) void load(ident);
  }, [ident, load]);

  // Returning from Tebex's login step: finish what they were doing.
  useEffect(() => {
    if (!basket?.username) return;
    let pending: { packageId: number; quantity: number } | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING);
      if (raw) pending = JSON.parse(raw);
      sessionStorage.removeItem(PENDING);
    } catch {}
    if (!pending) return;
    void addPackage(basket.ident, pending.packageId, pending.quantity).then(setBasket).catch(() => {});
  }, [basket?.username, basket?.ident]);

  const ensure = useCallback(async () => {
    if (ident) return ident;
    const b = await createBasket(window.location.origin);
    try {
      localStorage.setItem(KEY, b.ident);
    } catch {}
    setIdent(b.ident);
    setBasket(b);
    return b.ident;
  }, [ident]);

  const add = useCallback(
    async (packageId: number, quantity: number) => {
      setBusy(true);
      try {
        const id = await ensure();
        try {
          setBasket(await addPackage(id, packageId, quantity));
        } catch (e) {
          // Minecraft stores reject adds until the basket has a username on it.
          // Stash the intent, send them to Tebex to log in, replay on return.
          const needsLogin = e instanceof Error && /login/i.test(e.message);
          if (!needsLogin) throw e;
          const url = await getAuthUrl(id, window.location.href);
          if (!url) {
            throw new Error(
              "This store has no login method configured yet — finish the store setup in the Tebex panel.",
            );
          }
          try {
            sessionStorage.setItem(PENDING, JSON.stringify({ packageId, quantity }));
          } catch {}
          window.location.href = url;
        }
      } finally {
        setBusy(false);
      }
    },
    [ensure],
  );

  const remove = useCallback(
    async (packageId: number) => {
      if (!ident) return;
      setBusy(true);
      try {
        setBasket(await removePackage(ident, packageId));
      } finally {
        setBusy(false);
      }
    },
    [ident],
  );

  const refresh = useCallback(async () => {
    if (ident) await load(ident);
  }, [ident, load]);

  const count = basket?.packages.reduce((n, p) => n + (p.in_basket?.quantity || 0), 0) ?? 0;

  return (
    <BasketContext.Provider value={{ basket, count, busy, add, remove, refresh }}>{children}</BasketContext.Provider>
  );
}
