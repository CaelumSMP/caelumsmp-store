import type { NextConfig } from "next";

// Static export. Every route becomes plain HTML/CSS/JS with no server, which is
// what keeps hosting free and uncapped: Cloudflare Pages bills nothing for
// static assets and only meters Pages Functions, which this site never uses.
//
// The catalogue is fetched from Tebex in the browser rather than at build time,
// so prices and new packages appear without a redeploy.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
