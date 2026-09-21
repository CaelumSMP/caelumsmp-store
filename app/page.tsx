import { Cube } from "@/app/_ui/art";
import Strip from "@/app/_ui/Strip";
import Footer from "@/app/_ui/Footer";
import Board from "@/app/_ui/Board";
import Catalogue from "@/app/_ui/Catalogue";
import Identity from "@/app/_ui/Identity";
import { DISCORD, SITE_URL } from "@/app/_lib/config";

// The store front. Order is deliberate and follows what the big Minecraft
// stores do: short hero, info board, then products. Something buyable should be
// on screen before any scrolling.
//
// Everything here is static HTML; <Catalogue> fills in the packages client-side.
export default function StoreFront() {
  return (
    <>
      <Strip />

      <section className="cl-hero">
        <Cube size={52} d={34} at={{ left: "4%", top: "18%" }} top="#c6ff3d" left="#8fc41f" right="#6a9612" />
        <Cube size={36} d={-22} at={{ left: "16%", bottom: "14%" }} top="#ff5a5f" left="#c93b40" right="#9c2b30" />
        <Cube size={44} d={48} at={{ right: "7%", top: "12%" }} top="#4de3ff" left="#22a9c9" right="#167f99" />
        <Cube size={30} d={-34} at={{ right: "22%", bottom: "16%" }} top="#a77bff" left="#7448d6" right="#5631ab" />

        <div className="cl-hero-in">
          <span className="cl-kicker">Support the server</span>
          <h1>
            Gear <em>up</em>.
          </h1>
          <p className="cl-lede">
            Every purchase keeps CaelumSMP online and ad-free. Perks land in-game within a minute.
          </p>
        </div>
      </section>

      <Board />

      <Identity />

      <Catalogue />

      <div className="cl-trust">
        <div className="cl-a1">
          <h3>Instant delivery</h3>
          <p>Perks are applied automatically, usually within a minute. Be online, or just log in afterwards.</p>
        </div>
        <div className="cl-a2">
          <h3>Refunds</h3>
          <p>All payments are final. Chargebacks result in a permanent ban across the network.</p>
        </div>
        <div className="cl-a3">
          <h3>Need a hand?</h3>
          <p>
            Didn&apos;t get your purchase?{" "}
            {DISCORD ? (
              <a href={DISCORD} target="_blank" rel="noopener noreferrer">
                Open a ticket on Discord
              </a>
            ) : (
              "Open a ticket on Discord."
            )}
          </p>
        </div>
      </div>

      <Footer siteUrl={SITE_URL} discord={DISCORD} />
    </>
  );
}
