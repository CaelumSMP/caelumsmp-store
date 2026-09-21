"use client";

import { useEffect, useState } from "react";
import { avatarUrl } from "@/app/_lib/tebex";
import { lookupPlayer, type Lookup } from "@/app/_lib/mojang";
import { useBasket } from "@/app/_ui/BasketProvider";

// Who the perks go to, asked up front rather than at checkout.
//
// This isn't only a nicety: on a Minecraft: Offline store Tebex has no identity
// to verify against, so there's no login to redirect to. The username is
// attached when the basket is created, and without it Tebex refuses to accept
// any package at all.
//
// The premium lookup is advisory. An offline server accepts names that aren't
// premium, so a miss is a typo warning, never a block.
export default function Identity() {
  const { username, setUsername } = useBasket();
  const [draft, setDraft] = useState("");
  const [preview, setPreview] = useState("");
  // The result carries the name it was for, so "still checking" is derived
  // rather than stored — no synchronous setState in the effect.
  const [result, setResult] = useState<{ name: string; lookup: Lookup } | null>(null);

  // Debounced so the skin render and the lookup only fire once they stop typing.
  useEffect(() => {
    const t = setTimeout(() => setPreview(draft.trim()), 450);
    return () => clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    if (!preview) return;
    let cancelled = false;
    lookupPlayer(preview).then((lookup) => !cancelled && setResult({ name: preview, lookup }));
    return () => {
      cancelled = true;
    };
  }, [preview]);

  const lookup: Lookup = result?.name === preview ? result.lookup : { state: "unknown" };
  const checking = preview !== "" && result?.name !== preview;


  function confirm() {
    // Prefer Mojang's casing when we have it.
    setUsername(lookup.state === "premium" ? lookup.username : draft);
  }

  // Once we know who it's for, the header chip carries it and this disappears —
  // the store front shouldn't open with a form covering the packages.
  if (username) return null;

  return (
    <section className="cl-identity cl-wrap" id="who">
      <div className="cl-identity-bar">
        <img className="cl-identity-head" src={avatarUrl(preview || "Steve", 64)} alt="" />

        <div className="cl-identity-copy">
          <h2>Who are we delivering to?</h2>
          <p>
            {checking
              ? "Checking that name…"
              : lookup.state === "premium"
                ? `Found ${lookup.username} — premium account.`
                : lookup.state === "not-premium"
                  ? "No premium account with that name. Fine here — just match your in-game spelling."
                  : "Your Minecraft username, exactly as it appears in game."}
          </p>
        </div>

        <form
          className="cl-identity-row"
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Notch"
            aria-label="Minecraft username"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={16}
          />
          <button className="cl-btn" type="submit" disabled={!draft.trim()}>
            Continue
          </button>
        </form>
      </div>
    </section>
  );
}
