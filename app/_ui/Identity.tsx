"use client";

import { useEffect, useState } from "react";
import { skinUrl } from "@/app/_lib/tebex";
import { useBasket } from "@/app/_ui/BasketProvider";

// Who the perks go to, asked up front rather than at checkout.
//
// This isn't only a nicety: on a Minecraft: Offline store Tebex has no identity
// to verify against, so there's no login to redirect to. The username is
// attached when the basket is created, and without it Tebex refuses to accept
// any package at all.
export default function Identity() {
  const { username, setUsername } = useBasket();
  const [draft, setDraft] = useState("");
  const [preview, setPreview] = useState("");

  // Debounced so the skin render only fetches once they stop typing.
  useEffect(() => {
    const t = setTimeout(() => setPreview(draft.trim()), 450);
    return () => clearTimeout(t);
  }, [draft]);

  const shown = username || preview;

  return (
    <section className="cl-identity cl-wrap" id="who">
      <div className="cl-identity-card cl-neon cl-a1">
        <figure className="cl-identity-skin">
          {/* mc-heads renders a Steve silhouette for unknown names, so a typo
              shows a placeholder rather than a broken image. */}
          <img src={skinUrl(shown || "Steve", 260)} alt="" />
          <figcaption>{username ? username : shown ? shown : "You?"}</figcaption>
        </figure>

        <div className="cl-identity-form">
          <h2>Who are we delivering to?</h2>
          {username ? (
            <>
              <p>
                Perks will be delivered to <b>{username}</b> in game, usually within a minute of paying.
              </p>
              <button
                type="button"
                className="cl-btn cl-btn-ghost cl-a3"
                onClick={() => {
                  setDraft(username);
                  setUsername("");
                  // setUsername ignores empty input, so clear it directly.
                  try {
                    localStorage.removeItem("caelum.username");
                  } catch {}
                  location.reload();
                }}
              >
                Change username
              </button>
            </>
          ) : (
            <>
              <p>
                Your Minecraft username, exactly as it appears in game. This server runs in offline mode, so double-check
                the spelling — we can&apos;t look it up for you.
              </p>
              <form
                className="cl-identity-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  setUsername(draft);
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
