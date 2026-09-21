"use client";

import { categorySlug } from "@/app/_lib/tebex";
import { useStore } from "@/app/_ui/StoreProvider";
import PackageCard from "@/app/_ui/PackageCard";
import CategoryRail from "@/app/_ui/CategoryRail";
import Compare from "@/app/_ui/Compare";

export default function Catalogue() {
  const { categories, error, selected } = useStore();

  if (error) {
    return (
      <div className="cl-wrap" style={{ padding: "96px 0" }}>
        <div className="cl-neon cl-a2 cl-empty">
          <p>Couldn&apos;t load the store.</p>
          <p style={{ fontSize: 14, marginBottom: 24 }}>{error}</p>
          <button className="cl-btn" type="button" onClick={() => location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!categories) {
    // Skeleton rather than a spinner, so the page doesn't jump when it fills in.
    return (
      <div className="cl-wrap cl-section">
        <div className="cl-grid" aria-busy="true" aria-label="Loading packages">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`cl-pkg cl-neon cl-a${i + 1}`} style={{ minHeight: 320, opacity: 0.35 }} />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="cl-wrap" style={{ padding: "96px 0" }}>
        <div className="cl-neon cl-a3 cl-empty">
          <p>No packages are set up on the Tebex store yet.</p>
          <a className="cl-btn" href="https://creator.tebex.io/packages" target="_blank" rel="noopener noreferrer">
            Add packages
          </a>
        </div>
      </div>
    );
  }

  // One category at a time now that the "Everything" tab is gone.
  const shown = categories.filter((c) => categorySlug(c) === selected);

  return (
    <>
      <CategoryRail />

      {shown.map((category) => (
        <section key={category.id} className="cl-section cl-wrap" id={`c-${categorySlug(category)}`}>
          <h2 className="cl-head">
            {category.name}
            <span>{category.packages.length}</span>
          </h2>

          {category.description ? (
            <div
              className="cl-lede"
              style={{ margin: "-24px 0 32px" }}
              dangerouslySetInnerHTML={{ __html: category.description }}
            />
          ) : null}

          {/* Tebex's own "display type" on the category decides grid vs list. */}
          <div className={`cl-grid${category.display_type === "list" ? " cl-list" : ""}`}>
            {category.packages.map((p, i) => (
              <PackageCard key={p.id} pkg={p} accent={(i % 4) + 1} />
            ))}
          </div>

          {/* Below the cards: you pick a tier first, then check the detail. */}
          <Compare packages={category.packages} />
        </section>
      ))}
    </>
  );
}
