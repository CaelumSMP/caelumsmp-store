"use client";

import { useState } from "react";
import { useStore } from "@/app/_ui/StoreProvider";
import { SERVER_IP, DISCORD, SEASON } from "@/app/_lib/config";

// The four cells straddling the hero's bottom edge. Server IP is the one people
// actually come for; the rest give the store a sense of place — which season,
// what they're looking at, and where to get help.
export default function Board() {
  const { selectedName } = useStore();
  const [copied, setCopied] = useState(false);

  function copyIp() {
    navigator.clipboard.writeText(SERVER_IP).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <dl className="cl-board">
      <div className="cl-a1" style={{ ["--i" as string]: 0 }}>
        <dt>
          <i />
          Server IP
        </dt>
        <dd>
          <button type="button" onClick={copyIp}>
            {copied ? "Copied!" : SERVER_IP}
          </button>
        </dd>
      </div>

      <div className="cl-a2" style={{ ["--i" as string]: 1 }}>
        <dt>Season</dt>
        <dd>{SEASON}</dd>
      </div>

      <div className="cl-a3" style={{ ["--i" as string]: 2 }}>
        <dt>Browsing</dt>
        <dd>{selectedName}</dd>
      </div>

      <div className="cl-a4" style={{ ["--i" as string]: 3 }}>
        <dt>Need help?</dt>
        <dd>
          {DISCORD ? (
            <a href={DISCORD} target="_blank" rel="noopener noreferrer">
              Join the Discord
            </a>
          ) : (
            // No invite configured yet — say so rather than link nowhere.
            <span style={{ color: "var(--dim)" }}>Set DISCORD in config.ts</span>
          )}
        </dd>
      </div>
    </dl>
  );
}
