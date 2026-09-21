import Link from "next/link";

export default function Footer({ siteUrl, discord }: { siteUrl: string; discord: string }) {
  return (
    <footer className="cl-footer">
      <p className="cl-bye">
        See you
        <br />
        in-game.
      </p>
      <div className="cl-foot-row">
        <ul>
          {discord ? (
            <li>
              <a href={discord} target="_blank" rel="noopener noreferrer">
                Discord
              </a>
            </li>
          ) : null}
          <li>
            <a href={siteUrl}>Main site</a>
          </li>
        </ul>
        <ul>
          <li>
            <Link href="/">Store</Link>
          </li>
          <li>
            <Link href="/basket">Basket</Link>
          </li>
        </ul>
      </div>
      <small>
        &copy; 2026 CaelumSMP. Not affiliated with Mojang or Microsoft. Payments and fulfilment are handled by Tebex.
      </small>
    </footer>
  );
}
