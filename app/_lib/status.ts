// Players online + Discord online, mirroring ../caelum-web-fable/app/_lib/status.ts.
// That version runs on the server; this one runs in the browser because the store
// is a static export. Both upstream APIs send permissive CORS headers (verified),
// and both failure paths show "—" rather than breaking the header.
import { SERVER_IP, DISCORD, STATUS } from "./config";

export type Status = { online: number | null; max: number; discord: number | null };

export const fmt = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("en").format(n));

/** Pulls the invite code out of a full Discord URL. */
function discordCode(url: string) {
  return url.replace(/\/+$/, "").split("/").pop() || "";
}

async function json(url: string) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return r.ok ? await r.json() : null;
  } catch {
    return null; // offline or slow: show "—" rather than failing the header
  }
}

export async function getStatus(): Promise<Status> {
  if (STATUS.source === "demo") {
    return { online: STATUS.online, max: STATUS.max, discord: STATUS.discord };
  }
  const code = discordCode(DISCORD);
  const [mc, dc] = await Promise.all([
    json(`https://api.mcsrvstat.us/3/${encodeURIComponent(SERVER_IP)}`),
    code ? json(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`) : null,
  ]);
  return {
    online: mc?.online ? (mc.players?.online ?? 0) : mc ? 0 : null,
    max: mc?.players?.max ?? STATUS.max,
    discord: dc?.approximate_presence_count ?? null,
  };
}
