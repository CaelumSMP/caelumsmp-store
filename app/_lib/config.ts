// Store chrome that Tebex has no field for. Package names, prices, descriptions
// and artwork all come from the Tebex panel — only put things here that it
// genuinely can't hold. Keep in sync with ../caelum-web-fable/data/content.json.
export const SERVER_IP = "play.caelumsmp.net";
export const DISCORD = "";
export const SITE_URL = "https://caelumsmp.net";

/** Shown in the info board. Bump when a new season starts. */
export const SEASON = "Season 1";

// Mirrors ../caelum-web-fable/app/_lib/nav.ts so the store's header matches the
// main site. Links are absolute because the store is a separate deployment.
export const NAV = [
  ["/news", "News"],
  ["/leaderboards", "Leaderboards"],
  ["/players", "Players"],
  ["/team", "Team"],
  ["/vote", "Vote"],
  ["/rules", "Rules"],
] as const;
