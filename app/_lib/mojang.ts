// Looking up whether a username belongs to a real (premium) Mojang account.
//
// Mojang's own API sends no CORS headers, so it can't be called from the
// browser; playerdb.co proxies it and does. Verified: a real name returns 200
// with code "player.found" and the canonical casing, an invented one returns
// 400 "minecraft.invalid_username".
//
// This is advisory only. The server runs in offline mode, so a name that isn't
// premium is still perfectly valid — the lookup exists to catch typos, not to
// gate the purchase.

export type Lookup =
  | { state: "premium"; username: string; uuid: string }
  | { state: "not-premium" }
  /** Lookup failed. Not the same as "not premium" — don't tell the customer anything. */
  | { state: "unknown" };

export async function lookupPlayer(name: string): Promise<Lookup> {
  const clean = name.trim();
  if (!clean) return { state: "unknown" };
  try {
    const res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 400) return { state: "not-premium" };
    if (!res.ok) return { state: "unknown" };
    const body = await res.json();
    const player = body?.data?.player;
    if (body?.code !== "player.found" || !player?.username) return { state: "not-premium" };
    // playerdb returns the canonical casing, which is worth keeping: commands
    // delivered to "notch" and "Notch" are the same account on a premium
    // server but not necessarily on an offline one.
    return { state: "premium", username: player.username, uuid: player.id };
  } catch {
    return { state: "unknown" };
  }
}
