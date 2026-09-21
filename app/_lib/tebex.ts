// Tebex Headless API client.
//
// Base URL and response shapes come from docs.tebex.io/developers/headless-api.
// The token is the *public* token from creator.tebex.io/developers/api-keys —
// Tebex states it "is allowed to be shared publicly", which is why it's a
// NEXT_PUBLIC_ var and safe in the browser bundle. The private key is never
// used here; nothing this store does needs it.
//
// Nothing is cached: prices and sale state have to be current, and a small
// server's traffic doesn't justify the staleness. If that changes, the fix is
// `use cache` + `cacheLife` in next.config (cacheComponents: true), not a
// hand-rolled cache.

const TOKEN = process.env.NEXT_PUBLIC_TEBEX_TOKEN;
const ROOT = "https://headless.tebex.io/api";

// Two different bases, verified against the live API rather than the docs,
// which are inconsistent here:
//   account-scoped (token in path): categories, create basket, get basket, auth
//   basket-scoped  (no token):      add/remove packages
// Getting this wrong returns an HTML 404 page, not a JSON error.
const ACCOUNT = () => `${ROOT}/accounts/${TOKEN}`;
const BASKET = (ident: string) => `${ROOT}/baskets/${ident}`;

export type Media = { type: "image" | "video"; url: string; featured: boolean; primary: boolean };

export type Package = {
  id: number;
  name: string;
  description: string;
  image: string | null;
  type: string;
  category: { id: number; name: string };
  base_price: number;
  total_price: number;
  currency: string;
  discount: number;
  disable_quantity: boolean;
  disable_gifting: boolean;
  media: Media[];
  order: number;
  slug: string;
  user_limit: number;
  options: unknown[];
  variables: unknown[];
};

export type Category = {
  id: number;
  name: string;
  slug: string | null;
  description: string;
  packages: Package[];
  order: number;
  display_type: "list" | "grid";
  image_url: string | null;
  parent: { id: number } | null;
};

export type BasketPackage = {
  id: number;
  name: string;
  description: string;
  image: string | null;
  slug: string;
  type: "single" | "subscription";
  /** Quantity and line price live here, not on the package itself. */
  in_basket: { quantity: number; price: number; gift_username: string | null };
};

export type Basket = {
  id: string;
  ident: string;
  complete: boolean;
  username: string | null;
  base_price: number;
  total_price: number;
  currency: string;
  packages: BasketPackage[];
  links: { checkout?: string; payment?: string; auth?: string };
};

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  if (!TOKEN) throw new Error("NEXT_PUBLIC_TEBEX_TOKEN is not set — copy .env.example to .env.local");
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    // Tebex sends a JSON problem document with a human-readable `detail`; an
    // HTML body means the path is wrong, not the payload.
    const body = await res.text().catch(() => "");
    let reason = body.slice(0, 200);
    try {
      reason = JSON.parse(body).detail || reason;
    } catch {
      if (body.trimStart().startsWith("<")) reason = "endpoint not found";
    }
    throw new Error(reason);
  }
  return (await res.json()).data as T;
}

/** Every category with its packages, in store order. Empty categories are dropped. */
export async function getCategories(): Promise<Category[]> {
  const cats = await req<Category[]>(`${ACCOUNT()}/categories?includePackages=1`);
  return cats
    .filter((c) => c.packages.length > 0)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ ...c, packages: [...c.packages].sort((a, b) => a.order - b.order) }));
}

/** Tebex leaves `slug` null on some categories, so fall back to the id. */
export function categorySlug(c: Pick<Category, "id" | "slug">) {
  return c.slug || String(c.id);
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const cats = await getCategories();
  return cats.find((c) => categorySlug(c) === slug);
}

export async function getPackage(slug: string): Promise<Package | undefined> {
  const cats = await getCategories();
  for (const c of cats) {
    const found = c.packages.find((p) => p.slug === slug || String(p.id) === slug);
    if (found) return found;
  }
  return undefined;
}

// ---------- basket ----------

export async function createBasket(returnTo: string): Promise<Basket> {
  return req<Basket>(`${ACCOUNT()}/baskets`, {
    method: "POST",
    body: JSON.stringify({
      complete_url: `${returnTo}/basket?done=1`,
      cancel_url: `${returnTo}/basket`,
      complete_auto_redirect: true,
    }),
  });
}

export async function getBasket(ident: string): Promise<Basket> {
  return req<Basket>(`${ACCOUNT()}/baskets/${ident}`);
}

export async function addPackage(ident: string, packageId: number, quantity: number): Promise<Basket> {
  return req<Basket>(`${BASKET(ident)}/packages`, {
    method: "POST",
    body: JSON.stringify({ package_id: String(packageId), quantity }),
  });
}

export async function removePackage(ident: string, packageId: number): Promise<Basket> {
  return req<Basket>(`${BASKET(ident)}/packages/remove`, {
    method: "POST",
    body: JSON.stringify({ package_id: String(packageId) }),
  });
}

/**
 * Minecraft stores need the customer tied to the basket *before packages can be
 * added* — not at checkout. Adding first fails with "User must login before
 * adding packages to basket". Tebex hosts the username step; we send the
 * customer there and they return to `returnUrl`.
 *
 * Returns null when the store offers no login methods, which is what an
 * unfinished store setup looks like.
 */
export async function getAuthUrl(ident: string, returnUrl: string): Promise<string | null> {
  const opts = await req<{ name: string; url: string }[]>(
    `${ACCOUNT()}/baskets/${ident}/auth?returnUrl=${encodeURIComponent(returnUrl)}`,
  );
  return opts[0]?.url ?? null;
}

/** Money as Tebex reports it — two decimals, currency after the amount. */
export function price(amount: number, currency: string) {
  return `${amount.toFixed(2)} ${currency}`;
}

/** The card image: the primary media item, else the legacy `image` field. */
export function packageImage(p: Package): string | null {
  return p.media?.find((m) => m.type === "image" && m.primary)?.url || p.image || null;
}
