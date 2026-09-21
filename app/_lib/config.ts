// Store chrome that Tebex has no field for. Package names, prices, descriptions
// and artwork all come from the Tebex panel — only put things here that it
// genuinely can't hold. Keep in sync with ../caelum-web-fable/data/content.json.
export const SERVER_IP = "play.caelumsmp.net";
export const DISCORD = "https://discord.gg/caelumsmp";
export const SITE_URL = "https://caelumsmp.net";

/** Shown in the info board. Bump when a new season starts. */
export const SEASON = "Season 1";

// Mirrors settings.status in ../caelum-web-fable/data/content.json. "demo" shows
// the numbers below as-is; "live" queries mcsrvstat.us and Discord from the
// browser. Keep in step with the main site so both headers agree.
export const STATUS = {
  source: "live" as "demo" | "live",
  // Only used when source is "demo".
  online: 0,
  discord: 0,
  max: 100,
};

/** Shown in the full-screen menu, mirroring the main site's socials. */
export const SOCIALS: { label: string; href: string }[] = [
  { label: "Discord", href: "https://discord.gg/caelumsmp" },
  { label: "YouTube", href: "https://youtube.com/@caelumsmp" },
  { label: "X", href: "https://x.com/caelumsmp" },
  { label: "TikTok", href: "https://tiktok.com/@caelumsmp" },
];

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
