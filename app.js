/* DOOM INDEX — public static mirror (read-only). No scan, no POST, no secrets. */
(() => {
  "use strict";

  const BOARD_URLS = ["public-board.json", "data/public-board.json"];
  let lastPayload = null;
  let focusDriver = null;

  const $ = (sel) => document.querySelector(sel);

  function fmtTime(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(iso);
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function severityColor(pct) {
    const p = Number(pct) || 0;
    if (p >= 85) return "#ff2d55";
    if (p >= 65) return "#c44dff";
    if (p >= 45) return "#ff9a5c";
    if (p >= 30) return "#f0d878";
    if (p >= 16) return "#2ee6ff";
    return "#5dffc8";
  }

  function clockSvg(pct, { size = 120 } = {}) {
    const p = Math.max(0, Math.min(100, Number(pct) || 0));
    const color = severityColor(p);
    const angle = p * 3.6 - 90;
    const rad = (angle * Math.PI) / 180;
    const cx = 60;
    const cy = 60;
    const handLen = 32;
    const hx = cx + Math.cos(rad) * handLen;
    const hy = cy + Math.sin(rad) * handLen;
    let ticks = "";
    for (let i = 0; i < 10; i++) {
      const a = ((i * 36 - 90) * Math.PI) / 180;
      const x1 = cx + Math.cos(a) * 44;
      const y1 = cy + Math.sin(a) * 44;
      const x2 = cx + Math.cos(a) * 50;
      const y2 = cy + Math.sin(a) * 50;
      const major = i % 5 === 0;
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${major ? color : "#2a3a4c"}" stroke-width="${major ? 2.2 : 1.5}" opacity="${major ? 0.85 : 1}"/>`;
    }
    const gid = `p${Math.round(p)}${size}`;
    const outerGlow = `<circle cx="60" cy="60" r="54.5" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.35"/>`;
    const arcSweep = p >= 100 ? 0.001 : p;
    const arcEnd = ((arcSweep * 3.6 - 90) * Math.PI) / 180;
    const large = arcSweep > 50 ? 1 : 0;
    const ax = cx + Math.cos(arcEnd) * 53;
    const ay = cy + Math.sin(arcEnd) * 53;
    const arc =
      p > 0.5
        ? `<path d="M ${cx} ${cy - 53} A 53 53 0 ${large} 1 ${ax.toFixed(2)} ${ay.toFixed(2)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>`
        : "";
    return `<svg class="clock-face-svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
      <defs>
        <radialGradient id="face${gid}" cx="38%" cy="32%">
          <stop offset="0%" stop-color="#f0f4f8"/>
          <stop offset="50%" stop-color="#c8d4e0"/>
          <stop offset="100%" stop-color="#8a9aac"/>
        </radialGradient>
        <linearGradient id="bezel${gid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7a96ae"/>
          <stop offset="45%" stop-color="#2a3a4c"/>
          <stop offset="100%" stop-color="#121c28"/>
        </linearGradient>
        <filter id="glow${gid}" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#bezel${gid})"/>
      <circle cx="60" cy="60" r="52" fill="url(#face${gid})" stroke="#121c28" stroke-width="1.5"/>
      ${outerGlow}
      ${arc}
      ${ticks}
      <text x="60" y="38" text-anchor="middle" font-family="Outfit,sans-serif" font-size="6.5" font-weight="700" letter-spacing="2" fill="#3a5068">DOOM</text>
      <text x="60" y="80" text-anchor="middle" font-family="Bebas Neue,Outfit,sans-serif" font-size="16" font-weight="400" letter-spacing="1" fill="${color}" filter="url(#glow${gid})">${Math.round(p)}%</text>
      <line x1="60" y1="60" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#0e1620" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
      <line x1="60" y1="60" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="${color}" stroke-width="2.7" stroke-linecap="round" filter="url(#glow${gid})"/>
      <circle cx="60" cy="60" r="5" fill="#121c28"/>
      <circle cx="60" cy="60" r="2.4" fill="${color}"/>
    </svg>`;
  }

  function driverListHtml(drivers, kind, limit = 4) {
    if (!drivers || !drivers.length) {
      return '<li class="muted">No gated drivers this snapshot.</li>';
    }
    return drivers
      .slice(0, limit)
      .map((d, i) => {
        const title = escapeHtml(d.title || "—");
        const evid = escapeHtml(d.evidence || "");
        return `<li><button type="button" class="driver-btn" data-kind="${escapeAttr(kind)}" data-idx="${i}">${title}</button> <span class="muted tiny">${evid}</span></li>`;
      })
      .join("");
  }

  function provChip(label, cls = "") {
    return `<span class="prov-chip ${cls}">${escapeHtml(label)}</span>`;
  }

  function provenanceDriversHtml(drivers, limit = 8) {
    if (!drivers || !drivers.length) {
      return `<p class="muted tiny">No drivers listed for this meter.</p>`;
    }
    return `<ul class="prov-driver-list">${drivers
      .slice(0, limit)
      .map((d) => {
        const title = escapeHtml(d.title || "—");
        const link = d.link
          ? `<a href="${escapeAttr(d.link)}" target="_blank" rel="noopener noreferrer">${title}</a>`
          : title;
        const tier = d.sourceTier || null;
        const evid = d.evidence || (d.bodyConfirmed ? "body-confirmed" : null);
        const evidCls =
          evid === "body-confirmed"
            ? "evidence-body"
            : evid === "kev-catalog" || (evid && /kev/i.test(evid))
              ? "evidence-kev"
              : "";
        const decay =
          d.decayHint ||
          (d.decayFactor != null ? `decay ×${d.decayFactor} (~10d half-life)` : null);
        const chips = [
          tier ? provChip(`tier ${tier}`, `tier-${escapeAttr(tier)}`) : "",
          evid ? provChip(evid, evidCls) : "",
          d.source ? provChip(d.source) : "",
          decay ? provChip(decay, "decay") : "",
          d.publishedAt ? provChip(fmtTime(d.publishedAt)) : "",
          (d.clusterSize || 1) > 1 ? provChip(`cluster ×${d.clusterSize}`) : "",
          d.effectiveImpact != null
            ? provChip(`impact ${Number(d.effectiveImpact).toFixed(1)}`)
            : "",
        ]
          .filter(Boolean)
          .join("");
        return `<li class="prov-driver"><div>${link}</div><div class="prov-meta">${chips}</div></li>`;
      })
      .join("")}</ul>`;
  }

  function singleDriverHtml(d) {
    if (!d) return `<p class="muted">Driver not found.</p>`;
    const title = escapeHtml(d.title || "—");
    const link = d.link
      ? `<a href="${escapeAttr(d.link)}" target="_blank" rel="noopener noreferrer">${title}</a>`
      : title;
    const tier = d.sourceTier || null;
    const evid = d.evidence || (d.bodyConfirmed ? "body-confirmed" : null);
    const decay = d.decayHint || null;
    return `
      <p class="trust-kicker">Trust drawer · driver</p>
      <div class="prov-driver">
        <div>${link}</div>
        <div class="prov-meta">
          ${tier ? provChip(`tier ${tier}`, `tier-${escapeAttr(tier)}`) : ""}
          ${evid ? provChip(evid) : ""}
          ${d.source ? provChip(d.source) : ""}
          ${decay ? provChip(decay, "decay") : ""}
          ${d.publishedAt ? provChip(fmtTime(d.publishedAt)) : ""}
          ${d.effectiveImpact != null ? provChip(`impact ${Number(d.effectiveImpact).toFixed(1)}`) : ""}
        </div>
      </div>
      <p class="muted tiny">Outbound link opens the original source. This mirror does not fetch or rescan.</p>
    `;
  }

  function openProvenanceDrawer(kind, driverIdx) {
    const data = lastPayload;
    if (!data) return;
    const titleEl = $("#trust-drawer-title");
    const bodyEl = $("#trust-drawer-body");
    if (!titleEl || !bodyEl) return;

    const gate = (data.predictions && data.predictions.gate) || "closed";
    const gateBanner = `<p class="trust-banner">Prediction edges · calibration <strong>gate ${escapeHtml(
      gate === "open" ? "open" : "closed"
    )}</strong> · blend is blend, not prophecy · board will not invent edges.</p>`;

    if (kind === "driver-stress" || kind === "driver-pace") {
      const list = kind === "driver-stress" ? data.stress?.drivers : data.pace?.drivers;
      const d = (list || [])[driverIdx];
      titleEl.textContent = `Provenance · driver`;
      bodyEl.innerHTML = singleDriverHtml(d);
      $("#trust-drawer").showModal();
      return;
    }

    if (kind === "stress") {
      const s = data.stress || {};
      titleEl.textContent = `Provenance · Stress ${s.pct ?? "—"}%`;
      bodyEl.innerHTML = `
        <p class="trust-kicker">Trust drawer · Stress Index</p>
        <div class="trust-pct-row">
          <span class="trust-pct">${s.pct == null ? "—" : Math.round(s.pct)}</span>
          <span class="trust-tier">${escapeHtml(s.tier || (s.refused ? "Demo refused" : "—"))}</span>
        </div>
        <pre class="trust-formula">${escapeHtml(
          s.methodNotes ||
            "Stress = confirmation-gated cyber+conflict+infra+bio incident heat. Body-confirmed or Tier A/B; remediation excluded; ~10d half-life; quiet floor ~7%; ±12 delta cap. Demo never feeds."
        )}</pre>
        ${
          s.refused
            ? `<p class="trust-banner warn">${escapeHtml(s.note || "Stress refuses demo seed.")}</p>`
            : gateBanner
        }
        <h3>Top drivers</h3>
        ${provenanceDriversHtml(s.drivers)}
        <p class="muted tiny">Computed ${escapeHtml(fmtTime(s.computedAt))} · eligible ${s.eligibleCount ?? "—"} · confidence ${s.confidence ?? "—"}%</p>
      `;
    } else if (kind === "pace") {
      const p = data.pace || {};
      const apex = data.apex || {};
      const updated = p.apexUpdatedAt || apex.updatedAt || null;
      titleEl.textContent = `Provenance · Pace ${p.pct ?? "—"}%`;
      const spine = `
        <div class="apex-spine-grid" aria-label="Apex spine">
          <div class="apex-spine-cell"><span class="lbl">Recursive AI</span><span class="val">${p.recursiveAiPct ?? "—"}%</span></div>
          <div class="apex-spine-cell"><span class="lbl">AGI here</span><span class="val">${p.agiHerePct ?? "—"}%</span></div>
          <div class="apex-spine-cell"><span class="lbl">Closed-loop</span><span class="val">${p.closedLoopPct ?? "—"}%</span></div>
        </div>
        <p class="muted tiny">Apex asOf ${escapeHtml(p.apexAsOf || apex.asOf || "—")} · last updated ${escapeHtml(
          fmtTime(updated)
        )} · dial shelf ${p.dialPct ?? "—"}% · apexPace ${p.apexPace ?? "—"}${
          p.apexStale || apex.stale
            ? ` · <strong>stale ${p.apexStaleDays ?? apex.staleDays ?? "?"}d</strong>`
            : ""
        }</p>`;
      const srcList = (p.apexSources || apex.sources || [])
        .slice(0, 5)
        .map((src) => {
          const u = src.url
            ? `<a href="${escapeAttr(src.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.title || src.url)}</a>`
            : escapeHtml(src.title || "source");
          return `<li class="prov-driver"><div>${u}</div><div class="prov-meta">${provChip(
            src.publisher || "—"
          )}${src.publishedAt ? provChip(src.publishedAt) : ""}${
            src.role ? provChip(src.role) : ""
          }</div></li>`;
        })
        .join("");
      bodyEl.innerHTML = `
        <p class="trust-kicker">Trust drawer · Pace Index</p>
        <div class="trust-pct-row">
          <span class="trust-pct">${p.pct == null ? "—" : Math.round(p.pct)}</span>
          <span class="trust-tier">${escapeHtml(p.tier || "—")}</span>
        </div>
        <pre class="trust-formula">${escapeHtml(
          p.methodNotes ||
            "Pace = 0.55×dial haircut + 0.45×apex spine (recursiveAi×1.15 + agiHere×0.55 + closedLoop×1.5) + primary/fresh boosts."
        )}</pre>
        ${gateBanner}
        <h3>Apex spine</h3>
        ${spine}
        <h3>Apex sources</h3>
        <ul class="prov-driver-list">${srcList || "<li class='muted tiny'>No apex sources on file.</li>"}</ul>
        <h3>Top drivers</h3>
        ${provenanceDriversHtml(p.drivers)}
        <p class="muted tiny">Computed ${escapeHtml(fmtTime(p.computedAt))} · primaryBoost ${p.primaryBoost ?? 0} · freshBoost ${p.freshBoost ?? 0} · freshReleaseBoost ${p.freshReleaseBoost ?? 0}</p>
      `;
    } else if (kind === "blend") {
      const b = data.blend || {};
      const s = data.stress || {};
      const p = data.pace || {};
      titleEl.textContent = `Provenance · Blend ${b.pct ?? "—"}%`;
      bodyEl.innerHTML = `
        <p class="trust-kicker">Trust drawer · board temperature</p>
        <div class="trust-pct-row">
          <span class="trust-pct">${b.pct == null ? "—" : Math.round(b.pct)}</span>
          <span class="trust-tier">${escapeHtml(b.tier || "—")}</span>
        </div>
        <pre class="trust-formula">${escapeHtml(
          b.formula || "0.55×Stress + 0.45×Pace"
        )}
label: ${escapeHtml(b.label || "board temperature (blend, not prophecy)")}</pre>
        <p class="trust-banner"><strong>Blend is blend, not prophecy.</strong> It is a weighted mix of Stress and Pace for board temperature only — not an AGI timeline, not a forecast, not a trade signal.</p>
        ${gateBanner}
        <div class="detail-stats">
          <span>Stress ${s.pct ?? "—"}%</span>
          <span>Pace ${p.pct ?? "—"}%</span>
          <span>weights 0.55 / 0.45</span>
        </div>
      `;
    } else {
      return;
    }

    $("#trust-drawer").showModal();
  }

  function bindProvenanceClicks() {
    const bind = (el, kind) => {
      if (!el || el.dataset.provBound) return;
      el.dataset.provBound = "1";
      const go = (e) => {
        if (e.target.closest && e.target.closest("a,button.driver-btn")) return;
        openProvenanceDrawer(kind);
      };
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProvenanceDrawer(kind);
        }
      });
    };
    bind($("#stress-card"), "stress");
    bind($("#pace-card"), "pace");
    bind($("#blend-strip"), "blend");

    document.querySelectorAll(".driver-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const kind = btn.dataset.kind === "stress" ? "driver-stress" : "driver-pace";
        openProvenanceDrawer(kind, Number(btn.dataset.idx));
      });
    });
  }

  function renderApex(data) {
    const pace = data.pace || {};
    const apex = data.apex || {};
    const rec = pace.recursiveAiPct ?? apex.recursiveAi;
    const agi = pace.agiHerePct ?? apex.agiHere;
    const closed = pace.closedLoopPct ?? apex.closedLoop;
    const asOf = pace.apexAsOf || apex.asOf || "—";
    const stale = pace.apexStale || apex.stale;
    const staleDays = pace.apexStaleDays ?? apex.staleDays;

    const recEl = $("#apex-recursive");
    const agiEl = $("#apex-agi");
    if (recEl) {
      recEl.innerHTML =
        typeof rec === "number" ? `${Math.round(rec)}<span>%</span>` : `—<span>%</span>`;
    }
    if (agiEl) {
      agiEl.innerHTML =
        typeof agi === "number" ? `${Math.round(agi)}<span>%</span>` : `—<span>%</span>`;
    }

    const staleBadge = $("#apex-stale-badge");
    if (staleBadge) {
      if (stale) {
        staleBadge.classList.remove("hidden");
        staleBadge.textContent = `stale ${staleDays ?? "?"}d`;
      } else {
        staleBadge.classList.add("hidden");
      }
    }

    const notes = pace.apexNotes || apex.notes || {};
    const why = $("#apex-why");
    if (why) {
      const bits = [notes.recursiveAi, notes.agiHere].filter(Boolean);
      why.textContent = bits.length
        ? bits.join(" ")
        : "Apex spine from Anthropic / METR / Epoch public indexes. Cross-lab guess, not a scrape.";
    }
    const meta = $("#apex-meta");
    if (meta) {
      meta.textContent = `asOf ${asOf} · closed-loop ${closed ?? "—"}% · updated ${fmtTime(
        pace.apexUpdatedAt || apex.updatedAt
      )}${stale ? ` · apex stale ${staleDays ?? "?"}d` : ""}`;
    }
  }

  function renderDualMeters(data) {
    const stress = data.stress || {};
    const pace = data.pace || {};
    const blend = data.blend || {};

    const sp = typeof stress.pct === "number" ? stress.pct : null;
    const pp = typeof pace.pct === "number" ? pace.pct : null;

    const sc = $("#stress-clock");
    const pc = $("#pace-clock");
    if (sc) sc.innerHTML = clockSvg(sp ?? 0, { size: 140 });
    if (pc) pc.innerHTML = clockSvg(pp ?? 0, { size: 140 });

    const spEl = $("#stress-pct");
    const ppEl = $("#pace-pct");
    if (spEl) spEl.textContent = sp == null ? "—" : Math.round(sp);
    if (ppEl) ppEl.textContent = pp == null ? "—" : Math.round(pp);

    const st = $("#stress-tier");
    const pt = $("#pace-tier");
    if (st) st.textContent = stress.refused ? "Demo refused" : stress.tier || "—";
    if (pt) pt.textContent = pace.tier || "—";

    const sl = $("#stress-line");
    const pl = $("#pace-line");
    if (sl) {
      sl.textContent = stress.refused
        ? stress.note || stress.line || "Stress refuses demo seed."
        : stress.line || "";
    }
    if (pl) pl.textContent = pace.line || "";

    const apexMini = $("#pace-apex-mini");
    if (apexMini) {
      const stale =
        pace.apexStale || (data.apex && data.apex.stale)
          ? ` · apex stale ${pace.apexStaleDays ?? data.apex?.staleDays ?? "?"}d`
          : "";
      apexMini.textContent = `Recursive AI ${pace.recursiveAiPct ?? "—"}% · AGI ${pace.agiHerePct ?? "—"}% · Closed-loop ${pace.closedLoopPct ?? "—"}%${stale}`;
    }

    const sd = $("#stress-drivers");
    const pd = $("#pace-drivers");
    if (sd) sd.innerHTML = driverListHtml(stress.drivers, "stress");
    if (pd) pd.innerHTML = driverListHtml(pace.drivers, "pace");

    const bp = $("#blend-pct");
    const bf = $("#blend-formula");
    if (bp) bp.textContent = typeof blend.pct === "number" ? `${Math.round(blend.pct)}%` : "—";
    if (bf) {
      const base = blend.formula || "0.55×Stress + 0.45×Pace";
      bf.textContent = /not prophecy/i.test(base) ? base : `${base} · blend, not prophecy`;
    }
    const bg = $("#blend-gate");
    if (bg) {
      const g = (data.predictions && data.predictions.gate) || "closed";
      const verdict = (data.predictions && data.predictions.verdict) || "no edge";
      bg.textContent =
        g === "open"
          ? `Prediction edges · gate open · ${verdict}`
          : `Prediction edges · gate closed · ${verdict}`;
    }
  }

  function renderPredictions(pred) {
    const gateEl = $("#pred-gate");
    const feed = $("#pred-feed");
    if (!pred) {
      if (gateEl) gateEl.textContent = "Calibration gate · unavailable";
      if (feed) feed.innerHTML = `<p class="muted">No prediction block on this snapshot.</p>`;
      return;
    }
    const gate = pred.gate || "closed";
    const verdict = pred.verdict || "no edge";
    if (gateEl) {
      gateEl.textContent = `Calibration gate · ${gate} · ${verdict}`;
      gateEl.classList.toggle("open", gate === "open");
    }
    const markets = pred.markets || [];
    if (!feed) return;
    if (!markets.length) {
      feed.innerHTML = `<p class="muted">No markets on file. Gate ${escapeHtml(gate)} · ${escapeHtml(verdict)}.</p>`;
      return;
    }
    const edges = markets.filter((m) => m.edge);
    const shown = (edges.length ? edges : markets).slice(0, 8);
    feed.innerHTML =
      `<p class="muted tiny">${edges.length ? `${edges.length} edge(s)` : "No edges — gate closed / no calibrated edge"} · showing ${shown.length} of ${markets.length}</p>` +
      shown
        .map((m) => {
          const q = escapeHtml(m.question || m.id || "market");
          const url = m.polymarketUrl
            ? `<a href="${escapeAttr(m.polymarketUrl)}" target="_blank" rel="noopener noreferrer">${q}</a>`
            : q;
          const yes =
            m.marketYes == null ? "—" : `${Math.round(Number(m.marketYes) * 1000) / 10}%`;
          return `<article class="pred-card">
            <div>${url}</div>
            <div class="pred-meta">
              ${provChip(`call ${m.call || "—"}`)}
              ${provChip(`mkt yes ${yes}`)}
              ${m.edge ? provChip("edge") : provChip("no edge")}
            </div>
            <p class="muted tiny">${escapeHtml(m.reason || "")}</p>
          </article>`;
        })
        .join("");
  }

  function renderSourceHealth(summary) {
    const el = $("#source-health");
    if (!el) return;
    if (summary == null) {
      el.innerHTML = `<p class="muted">No <code>sourceHealthSummary</code> on this snapshot. Private scan health was not exported — meters and drivers above still carry their own source / tier / evidence chips.</p>`;
      return;
    }
    if (typeof summary === "string") {
      el.innerHTML = `<p>${escapeHtml(summary)}</p>`;
      return;
    }
    if (Array.isArray(summary)) {
      el.innerHTML = `<div class="source-grid">${summary
        .map((row) => {
          const ok = row.ok === true ? "ok" : row.ok === false ? "fail" : "";
          const name = escapeHtml(row.name || row.id || "source");
          const note = row.error || row.note || (row.count != null ? `n=${row.count}` : "");
          return `<div class="source-chip ${ok}">${name}${note ? `<br><span class="muted">${escapeHtml(String(note))}</span>` : ""}</div>`;
        })
        .join("")}</div>`;
      return;
    }
    if (typeof summary === "object") {
      const parts = [];
      if (summary.ok != null) parts.push(`ok ${summary.ok}`);
      if (summary.fail != null) parts.push(`fail ${summary.fail}`);
      if (summary.total != null) parts.push(`total ${summary.total}`);
      if (summary.note) parts.push(summary.note);
      el.innerHTML = `<p>${escapeHtml(parts.join(" · ") || JSON.stringify(summary))}</p>`;
      return;
    }
    el.innerHTML = `<p class="muted">Unrecognized sourceHealthSummary shape.</p>`;
  }

  function renderHeader(data) {
    const pub = $("#published-badge");
    if (pub) {
      const when = data.publishedAt || data.lastUpdated || data.computedAt;
      pub.textContent = `published · ${fmtTime(when)}`;
      const ageMs = when ? Date.now() - new Date(when).getTime() : null;
      pub.classList.remove("fresh", "aging", "stale");
      if (ageMs != null && Number.isFinite(ageMs)) {
        const hours = ageMs / 36e5;
        if (hours < 6) pub.classList.add("fresh");
        else if (hours < 36) pub.classList.add("aging");
        else pub.classList.add("stale");
      }
    }
    const mode = $("#mode-badge");
    if (mode) mode.textContent = data.mode ? `mirror · ${data.mode}` : "mirror";

    const disc = $("#footer-disclaimer");
    if (disc && data.disclaimer) disc.textContent = data.disclaimer;
  }

  function renderAll(data) {
    lastPayload = data;
    renderHeader(data);
    renderApex(data);
    renderDualMeters(data);
    renderPredictions(data.predictions);
    renderSourceHealth(data.sourceHealthSummary);
    bindProvenanceClicks();
  }

  async function loadBoard() {
    let lastErr = null;
    for (const url of BOARD_URLS) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
        const data = await res.json();
        renderAll(data);
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    const banner = $("#mirror-banner");
    if (banner) {
      banner.className = "error-banner";
      banner.textContent = `Could not load public-board.json. ${lastErr && lastErr.message ? lastErr.message : lastErr}`;
    }
  }

  loadBoard();
})();
