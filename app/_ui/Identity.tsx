"use client";

import { useEffect, useState } from "react";
import { skinUrl } from "@/app/_lib/tebex";
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
  const { username, setUsername, clearUsername } = useBasket();
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

  const shown = username || preview;

  function confirm() {
    // Prefer Mojang's casing when we have it.
    setUsername(lookup.state === "premium" ? lookup.username : draft);
  }

  return (
    <section className="cl-identity cl-wrap" id="who">
      <div className="cl-identity-card cl-neon cl-a1">
        <figure className="cl-identity-skin">
          {/* mc-heads renders a Steve silhouette for unknown names, so a typo
              shows a placeholder rather than a broken image. */}
          <img src={skinUrl(shown || "Steve", 260)} alt="" />
          <figcaption>{shown || "You?"}</figcaption>
        </figure>

        <div className="cl-identity-form">
          <h2>Who are we delivering to?</h2>

          {username ? (
            <>
              <p>
                Perks will be delivered to <b>{username}</b> in game, usually within a minute of paying.
              </p>
              <button type="button" className="cl-btn cl-btn-ghost cl-a3" onClick={clearUsername}>
                Change username
              </button>
            </>
          ) : (
            <>
              <p>
                Your Minecraft username, exactly as it appears in game. This server runs in offline mode, so
                double-check the spelling — we can&apos;t look it up for you.
              </p>

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

              {preview && !checking ? (
                <p className={`cl-identity-note cl-note-${lookup.state}`}>
                  {lookup.state === "premium" ? (
                    <>
                      Found <b>{lookup.username}</b> — that&apos;s a premium account, and this is their skin.
                    </>
                  ) : lookup.state === "not-premium" ? (
                    <>No premium account with that name. That&apos;s fine here — just make sure the spelling matches
                    what you use in game.</>
                  ) : null}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
