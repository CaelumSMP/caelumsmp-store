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

export default function BasketProvider({ children }: { children: React.ReactNode }) {
  const [basket, setBasket] = useState<Basket | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (!saved) return;
    let cancelled = false;
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
    const existing = basket?.ident ?? readIdent();
    if (existing) return existing;
    const b = await createBasket(window.location.origin);
    writeIdent(b.ident);
    setBasket(b);
    return b.ident;
  }, [basket?.ident]);

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
    <BasketContext.Provider value={{ basket, count, busy, add, remove, refresh }}>{children}</BasketContext.Provider>
  );
}
