/* CaelumSMP store behaviour. No dependencies, no build step.
   Everything degrades: with JS off you still get working links, forms and prices. */
(function () {
  "use strict";

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- quantity stepper ----------
     Wraps a hidden `quantity` input on an add-to-basket form. Used for crate keys
     and anything else bought in multiples. Clamped to the package's own max. */
  function clamp(n, min, max) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = min;
    return Math.min(Math.max(n, min), max);
  }

  function initQty(box) {
    var input = box.querySelector("input");
    var min = parseInt(input.min, 10) || 1;
    var max = parseInt(input.max, 10) || 999;
    var scope = box.closest("[data-pkg]") || document;

    function set(v, fromChip) {
      input.value = clamp(v, min, max);
      // Keep the price preview and the bulk chips in step with the field.
      var unit = parseFloat(scope.getAttribute("data-price") || "0");
      var out = scope.querySelector("[data-total]");
      if (out && unit) {
        out.textContent = (unit * input.value).toFixed(2);
      }
      if (!fromChip) {
        scope.querySelectorAll(".cl-bulk button").forEach(function (chip) {
          chip.setAttribute("aria-pressed", String(+chip.dataset.qty === +input.value));
        });
      }
    }

    box.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        set(+input.value + (+btn.dataset.step || 0));
      });
    });
    input.addEventListener("change", function () { set(input.value); });

    scope.querySelectorAll(".cl-bulk button").forEach(function (chip) {
      chip.addEventListener("click", function () {
        set(chip.dataset.qty, true);
        scope.querySelectorAll(".cl-bulk button").forEach(function (c) {
          c.setAttribute("aria-pressed", String(c === chip));
        });
      });
    });

    set(input.value);
  }

  document.querySelectorAll(".cl-qty").forEach(initQty);

  /* ---------- category selector ----------
     The rail filters the sections already on the page rather than navigating,
     so switching categories on the homepage is instant. Each button still has a
     real href fallback in the markup for the no-JS case. */
  var rail = document.querySelector("[data-rail]");
  if (rail) {
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-cat]"));
    var buttons = Array.prototype.slice.call(rail.querySelectorAll("[data-filter]"));

    function show(key) {
      sections.forEach(function (sec) {
        sec.hidden = key !== "all" && sec.dataset.cat !== key;
      });
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.filter === key));
      });
      try {
        history.replaceState(null, "", key === "all" ? location.pathname : "#c-" + key);
      } catch (e) { /* file:// preview */ }
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        show(b.dataset.filter);
      });
    });

    var start = location.hash.indexOf("#c-") === 0 ? location.hash.slice(3) : "all";
    show(sections.some(function (s) { return s.dataset.cat === start; }) ? start : "all");
  }

  /* ---------- comparison table ----------
     Built from what is already written in each package's description: every <li>
     becomes a feature row, ticked for the packages that list it. Nothing extra to
     maintain in the Tebex panel — write the perks as a bullet list and this follows. */
  function norm(s) {
    return s.replace(/\s+/g, " ").trim().toLowerCase();
  }

  document.querySelectorAll("[data-compare]").forEach(function (host) {
    var section = host.closest("[data-cat]") || document;
    var pkgs = Array.prototype.slice.call(section.querySelectorAll("[data-pkg]"));
    if (pkgs.length < 2) return;

    var rows = [];          // [{ label, seen:Set }] in first-seen order
    var index = {};

    pkgs.forEach(function (pkg, i) {
      pkg.querySelectorAll(".cl-pkg-desc li").forEach(function (li) {
        var key = norm(li.textContent);
        if (!key) return;
        if (!(key in index)) {
          index[key] = rows.length;
          rows.push({ label: li.textContent.trim(), seen: {} });
        }
        rows[index[key]].seen[i] = true;
      });
    });

    if (!rows.length) return;

    var accents = ["cl-a1", "cl-a2", "cl-a3", "cl-a4"];
    var table = document.createElement("table");
    table.className = "cl-compare";

    var head = pkgs.map(function (pkg, i) {
      return (
        '<th scope="col" class="' + accents[i % 4] + '">' +
        '<span class="cl-compare-name">' + pkg.dataset.pkg + "</span>" +
        '<span class="cl-compare-price">' + (pkg.dataset.priceLabel || "") + "</span>" +
        "</th>"
      );
    }).join("");

    var body = rows.map(function (row) {
      var cells = pkgs.map(function (_, i) {
        return row.seen[i]
          ? '<td><span class="cl-yes" role="img" aria-label="Included">&#10003;</span></td>'
          : '<td><span class="cl-no" role="img" aria-label="Not included">&#8212;</span></td>';
      }).join("");
      return '<tr><th scope="row">' + row.label + "</th>" + cells + "</tr>";
    }).join("");

    table.innerHTML =
      "<thead><tr><th></th>" + head + "</tr></thead><tbody>" + body + "</tbody>";

    var wrap = document.createElement("div");
    wrap.className = "cl-compare-wrap";
    wrap.appendChild(table);
    host.appendChild(wrap);

    // Let the section's toggle swap between the card grid and the table.
    var toggle = section.querySelector("[data-compare-toggle]");
    if (toggle) {
      var grid = section.querySelector(".cl-grid");
      toggle.hidden = false;
      toggle.addEventListener("click", function () {
        var on = toggle.getAttribute("aria-pressed") !== "true";
        toggle.setAttribute("aria-pressed", String(on));
        wrap.hidden = !on;
        if (grid) grid.hidden = on;
      });
      wrap.hidden = true;
    }
  });

  /* ---------- hero parallax ---------- */
  var hero = document.querySelector(".cl-hero");
  if (hero && !reduced) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
    });
    hero.addEventListener("pointerleave", function () {
      hero.style.setProperty("--mx", 0);
      hero.style.setProperty("--my", 0);
    });
  }

  /* ---------- copy server IP ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(btn.dataset.copy).then(function () {
        var was = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(function () { btn.textContent = was; }, 1600);
      });
    });
  });

  /* ---------- toast ---------- */
  var toast = document.querySelector(".cl-toast");
  if (toast) setTimeout(function () { toast.remove(); }, 6000);
})();
