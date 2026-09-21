import type { Metadata } from "next";
import { Rubik_Mono_One, Space_Grotesk } from "next/font/google";
import BasketProvider from "@/app/_ui/BasketProvider";
import StoreProvider from "@/app/_ui/StoreProvider";
import "./globals.css";

// Same two faces as the main site, so the store and caelumsmp.com read as one brand.
const display = Rubik_Mono_One({ weight: "400", subsets: ["latin"], variable: "--display" });
const body = Space_Grotesk({ subsets: ["latin"], variable: "--body" });

export const metadata: Metadata = {
  title: { default: "CaelumSMP Store", template: "%s — CaelumSMP Store" },
  description: "Ranks, crate keys and perks for CaelumSMP. Delivered in-game within a minute.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <StoreProvider>
          <BasketProvider>{children}</BasketProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
