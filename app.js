/* DOOM INDEX — public pyramid clock wall (read-only). No scan, no POST, no secrets. */
(() => {
  "use strict";

  const BOARD_URLS = ["public-board.json", "data/public-board.json"];

  const DOMAIN_ORDER = [
    "tech_control",
    "cyber_info",
    "policy_law",
    "politics_geo",
    "social_labor",
    "physical_bio",
    "weird_signals",
    "scenario_watch",
    "zeihan_watch",
    "lex_watch",
    "rogan_watch",
    "dwarkesh_watch",
  ];

  const DOMAIN_MARK = {
    tech_control: "◈",
    cyber_info: "⬡",
    policy_law: "▣",
    politics_geo: "◎",
    social_labor: "◇",
    physical_bio: "⊕",
    weird_signals: "✧",
    scenario_watch: "☽",
    zeihan_watch: "⌖",
    lex_watch: "🎙",
    rogan_watch: "📻",
    dwarkesh_watch: "📡",
  };

  let lastPayload = null;
  let svgSeq = 0;

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

  function tierName(tier) {
    if (!tier) return "";
    if (typeof tier === "string") return tier;
    return tier.name || "";
  }

  function severityClass(pct) {
    const p = Number(pct) || 0;
    if (p >= 85) return "sev-cooked";
    if (p >= 65) return "sev-magma";
    if (p >= 45) return "sev-hot";
    if (p >= 30) return "sev-warm";
    if (p >= 16) return "sev-cool";
    return "sev-chill";
  }

  function severityLabel(pct) {
    const p = Number(pct) || 0;
    if (p >= 85) return "marble's worried";
    if (p >= 65) return "lobby sweat";
    if (p >= 45) return "ticket weather";
    if (p >= 30) return "warm brass";
    if (p >= 16) return "cool steel";
    return "nap tier";
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

  function clockSvg(pct, { size = 120, master = false } = {}) {
    const p = Math.max(0, Math.min(100, Number(pct) || 0));
    const color = severityColor(p);
    const angle = p * 3.6 - 90;
    const rad = (angle * Math.PI) / 180;
    const cx = 60;
    const cy = 60;
    const handLen = master ? 40 : 32;
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
    const gid = `c${svgSeq++}`;
    const outerGlow = master
      ? `<circle cx="60" cy="60" r="55" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.55"/>
         <circle cx="60" cy="60" r="57.5" fill="none" stroke="${color}" stroke-width="0.6" opacity="0.25"/>`
      : `<circle cx="60" cy="60" r="54.5" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.35"/>`;
    const arcSweep = p >= 100 ? 0.001 : p;
    const arcEnd = ((arcSweep * 3.6 - 90) * Math.PI) / 180;
    const large = arcSweep > 50 ? 1 : 0;
    const ax = cx + Math.cos(arcEnd) * 53;
    const ay = cy + Math.sin(arcEnd) * 53;
    const arc =
      p > 0.5
        ? `<path d="M ${cx} ${cy - 53} A 53 53 0 ${large} 1 ${ax.toFixed(2)} ${ay.toFixed(2)}" fill="none" stroke="${color}" stroke-width="${master ? 3.5 : 2.5}" stroke-linecap="round" opacity="0.9"/>`
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
      <text x="60" y="80" text-anchor="middle" font-family="Bebas Neue,Outfit,sans-serif" font-size="${master ? 22 : 16}" font-weight="400" letter-spacing="1" fill="${color}" filter="url(#glow${gid})">${Math.round(p)}%</text>
      <line x1="60" y1="60" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#0e1620" stroke-width="${master ? 5.5 : 4}" stroke-linecap="round" opacity="0.3"/>
      <line x1="60" y1="60" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="${color}" stroke-width="${master ? 3.4 : 2.7}" stroke-linecap="round" filter="url(#glow${gid})"/>
      <circle cx="60" cy="60" r="5" fill="#121c28"/>
      <circle cx="60" cy="60" r="2.4" fill="${color}"/>
    </svg>`;
  }

  function applySeverity(el, pct) {
    if (!el) return;
    el.classList.remove("sev-chill", "sev-cool", "sev-warm", "sev-hot", "sev-magma", "sev-cooked");
    el.classList.add(severityClass(pct));
  }

  function provChip(label, cls = "") {
    return `<span class="prov-chip ${cls}">${escapeHtml(label)}</span>`;
  }

  function provenanceDriversHtml(drivers, limit = 8) {
    if (!drivers || !drivers.length) {
      return `<p class="muted tiny">No receipts on this dial. It is running on posture.</p>`;
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
            : evid === "kev-catalog" || (evid && /kev/i.test(String(evid)))
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
            : d.impact != null
              ? provChip(`impact ${d.impact}`)
              : "",
        ]
          .filter(Boolean)
          .join("");
        return `<li class="prov-driver"><div>${link}</div><div class="prov-meta">${chips}</div></li>`;
      })
      .join("")}</ul>`;
  }

  function gateBannerHtml(data) {
    const gate = (data.predictions && data.predictions.gate) || "closed";
    return `<p class="trust-banner">Prediction edges · calibration <strong>gate ${escapeHtml(
      gate === "open" ? "open" : "closed"
    )}</strong> · blend is blend, not prophecy · board will not invent edges.</p>`;
  }

  function openProvenanceDrawer(kind, dialOpts) {
    const data = lastPayload;
    if (!data) return;
    const titleEl = $("#trust-drawer-title");
    const bodyEl = $("#trust-drawer-body");
    if (!titleEl || !bodyEl) return;
    const gateBanner = gateBannerHtml(data);

    if (kind === "stress") {
      const s = data.stress || {};
      titleEl.textContent = `Provenance · Stress ${s.pct ?? "—"}%`;
      bodyEl.innerHTML = `
        <p class="trust-kicker">Trust drawer · Stress Index</p>
        <div class="trust-pct-row">
          <span class="trust-pct">${s.pct == null ? "—" : Math.round(s.pct)}</span>
          <span class="trust-tier">${escapeHtml(tierName(s.tier) || (s.refused ? "Demo refused" : "—"))}</span>
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
        ${s.line ? `<p>${escapeHtml(s.line)}</p>` : ""}
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
          <span class="trust-tier">${escapeHtml(tierName(p.tier) || "—")}</span>
        </div>
        <pre class="trust-formula">${escapeHtml(
          p.methodNotes ||
            "Pace = 0.55×dial haircut + 0.45×apex spine (recursiveAi×1.15 + agiHere×0.55 + closedLoop×1.5) + primary/fresh boosts."
        )}</pre>
        ${gateBanner}
        ${p.line ? `<p>${escapeHtml(p.line)}</p>` : ""}
        <h3>Apex spine</h3>
        ${spine}
        <h3>Apex sources</h3>
        <ul class="prov-driver-list">${srcList || "<li class='muted tiny'>No apex sources packed. The spine is still a guess with a date on it.</li>"}</ul>
        <h3>Top drivers</h3>
        ${provenanceDriversHtml(p.drivers)}
        <p class="muted tiny">Computed ${escapeHtml(fmtTime(p.computedAt))} · primaryBoost ${p.primaryBoost ?? 0} · freshBoost ${p.freshBoost ?? 0} · freshReleaseBoost ${p.freshReleaseBoost ?? 0}</p>
      `;
    } else if (kind === "blend" || kind === "overall") {
      const b = data.blend || {};
      const s = data.stress || {};
      const p = data.pace || {};
      const o = data.overall || data.legacyOverall || {};
      const face = typeof b.pct === "number" ? b.pct : o.pct;
      titleEl.textContent = `Provenance · Master ${face ?? "—"}%`;
      bodyEl.innerHTML = `
        <p class="trust-kicker">Trust drawer · board temperature</p>
        <div class="trust-pct-row">
          <span class="trust-pct">${face == null ? "—" : Math.round(face)}</span>
          <span class="trust-tier">${escapeHtml(tierName(b.tier) || tierName(o.tier) || "—")}</span>
        </div>
        <pre class="trust-formula">${escapeHtml(b.formula || "0.55×Stress + 0.45×Pace")}
label: ${escapeHtml(b.label || "board temperature (blend, not prophecy)")}</pre>
        <p class="trust-banner"><strong>Blend is blend, not prophecy.</strong> It is a weighted mix of Stress and Pace for board temperature only — not an AGI timeline, not a forecast, not a trade signal.</p>
        ${gateBanner}
        <div class="detail-stats">
          <span>Stress ${s.pct ?? "—"}%</span>
          <span>Pace ${p.pct ?? "—"}%</span>
          <span>weights 0.55 / 0.45</span>
          <span>legacy rollup ${o.pct ?? "—"}%${o.tier ? ` · ${escapeHtml(tierName(o.tier))}` : ""}</span>
          ${o.confidence != null ? `<span>rollup confidence ${escapeHtml(String(o.confidence))}%</span>` : ""}
        </div>
        ${o.line ? `<p class="muted tiny">Legacy domain rollup: ${escapeHtml(o.line)}</p>` : ""}
        <p class="muted tiny">The face is the blend. The engraved rollup is the shelves’ own argument. Please don’t stir them together.</p>
      `;
    } else if (kind === "dial" && dialOpts) {
      const { domainId, subId } = dialOpts;
      const d = (data.domains || {})[domainId];
      const subs = d && d.subs;
      const s = subs && (subs[subId] || Object.values(subs).find((row) => row && row.id === subId));
      if (!s) return;
      const title = s.clockLabel || s.name || subId;
      titleEl.textContent = `Provenance · ${title} · ${s.pct}%`;
      const parts = s.scoreParts || {};
      const conf = s.confirmation || {};
      const formula =
        parts.intensity != null
          ? "incident dial: intensity×scale + coverage + recency + incidentSpread + corroboration − loneD − confirmDamp; then × time-decay (~10d half-life). Quiet floor ~7%."
          : parts.prior != null
            ? `shelf dial: ${parts.formula || `${parts.priorBlend}×prior + ${parts.evidenceBlend}×evidence`} (prior ${parts.prior}% · evidence ${parts.evidenceScore}%).`
            : s.methodNotes || "Snapshot dial. Drivers below are the sources on this export.";
      const wSub = typeof s.weight === "number" ? `${(s.weight * 100).toFixed(0)}% of domain` : "—";
      const wDom = d && typeof d.weight === "number" ? `${(d.weight * 100).toFixed(0)}% of rollup` : "—";
      bodyEl.innerHTML = `
        <p class="trust-kicker">Trust drawer · dial · ${escapeHtml(d.shelfLabel || d.name || domainId)}</p>
        <div class="trust-pct-row">
          <span class="trust-pct">${s.pct}</span>
          <span class="trust-tier">${escapeHtml(tierName(s.tier) || "—")}</span>
        </div>
        <p><strong>${escapeHtml(s.name || title)}</strong> on the <em>${escapeHtml(d.shelfLabel || d.name || "")}</em> shelf.</p>
        <pre class="trust-formula">${escapeHtml(formula)}</pre>
        ${gateBanner}
        <div class="detail-stats">
          <span>confidence ${s.confidence ?? "—"}%</span>
          <span>sub weight ${escapeHtml(wSub)}</span>
          <span>domain weight ${escapeHtml(wDom)}</span>
          <span>shelf ${d.pct ?? "—"}%</span>
          ${s.lastSignalAt ? `<span>last signal ${fmtTime(s.lastSignalAt)}</span>` : ""}
          ${conf.note ? `<span>${escapeHtml(conf.note)}</span>` : ""}
          ${s.staleness && s.staleness.badge ? `<span>${escapeHtml(s.staleness.badge)}</span>` : ""}
        </div>
        ${
          s.rationale
            ? `<div class="dossier-block"><h3 style="margin-top:0">Rationale</h3><p>${escapeHtml(s.rationale)}</p></div>`
            : ""
        }
        <h3>Drivers</h3>
        ${provenanceDriversHtml(s.drivers || s.signals, 8)}
        ${s.methodNotes ? `<p class="muted tiny">${escapeHtml(s.methodNotes)}</p>` : ""}
      `;
    } else {
      return;
    }

    const drawer = $("#trust-drawer");
    if (drawer && typeof drawer.showModal === "function") drawer.showModal();
  }

  function bindProvenanceClicks() {
    if (document.body.dataset.provBound) return;
    document.body.dataset.provBound = "1";
    document.body.addEventListener("click", (e) => {
      const clock = e.target.closest("[data-provenance]");
      if (!clock) return;
      if (e.target.closest("a")) return;
      const kind = clock.dataset.provenance;
      if (kind === "dial") {
        openProvenanceDrawer("dial", { domainId: clock.dataset.domain, subId: clock.dataset.sub });
      } else {
        openProvenanceDrawer(kind);
      }
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
      recEl.innerHTML = typeof rec === "number" ? `${Math.round(rec)}<span>%</span>` : `—<span>%</span>`;
    }
    if (agiEl) {
      agiEl.innerHTML = typeof agi === "number" ? `${Math.round(agi)}<span>%</span>` : `—<span>%</span>`;
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
        : "Apex spine from the public indexes. A cross-lab guess, not a scrape.";
    }
    const meta = $("#apex-meta");
    if (meta) {
      meta.textContent = `asOf ${asOf} · closed-loop ${closed ?? "—"}% · updated ${fmtTime(
        pace.apexUpdatedAt || apex.updatedAt
      )}${stale ? ` · apex stale ${staleDays ?? "?"}d` : ""}`;
    }
  }

  function renderMaster(data) {
    const blend = data.blend || {};
    const overall = data.overall || data.legacyOverall || {};
    const face = typeof blend.pct === "number" ? blend.pct : overall.pct;
    const btn = $("#master-clock");
    const slot = $("#master-face");
    if (slot) slot.innerHTML = clockSvg(face ?? 0, { size: 280, master: true });
    applySeverity(btn, face ?? 0);
    if (btn) {
      btn.dataset.provenance = typeof blend.pct === "number" ? "blend" : "overall";
      const label = blend.label || "board temperature (blend, not prophecy)";
      btn.setAttribute(
        "aria-label",
        `Master blend clock ${face == null ? "unavailable" : Math.round(face) + " percent"}. ${label}. Open provenance.`
      );
      if (face != null) {
        btn.title = `Blend ${Math.round(face)}%. Click for the recipe. Still not a prophecy.`;
      }
    }
    const lab = $("#master-label");
    if (lab) lab.textContent = blend.label || "Blend, not prophecy";
    const chip = $("#master-chip");
    if (chip) chip.textContent = severityLabel(face ?? 0);
    const tier = $("#master-tier");
    if (tier) tier.textContent = tierName(blend.tier) || tierName(overall.tier) || "—";
    const formula = $("#master-formula");
    if (formula) {
      const base = blend.formula || "0.55×Stress + 0.45×Pace";
      formula.textContent = /not prophecy/i.test(base) ? base : `${base} · blend, not prophecy`;
    }
    const legacy = $("#master-legacy");
    if (legacy) {
      if (typeof overall.pct === "number") {
        const t = tierName(overall.tier);
        legacy.textContent = `Legacy domain rollup ${Math.round(overall.pct)}%${t ? ` · ${t}` : ""}`;
      } else {
        legacy.textContent = "Legacy domain rollup —";
      }
    }
  }

  function renderPair(data) {
    const stress = data.stress || {};
    const pace = data.pace || {};
    const sp = typeof stress.pct === "number" ? stress.pct : null;
    const pp = typeof pace.pct === "number" ? pace.pct : null;

    const sc = $("#stress-clock");
    const pc = $("#pace-clock");
    if (sc) sc.innerHTML = clockSvg(sp ?? 0, { size: 168 });
    if (pc) pc.innerHTML = clockSvg(pp ?? 0, { size: 168 });
    applySeverity($("#stress-btn"), sp ?? 0);
    applySeverity($("#pace-btn"), pp ?? 0);

    const spEl = $("#stress-pct");
    const ppEl = $("#pace-pct");
    if (spEl) spEl.textContent = sp == null ? "—" : `${Math.round(sp)}%`;
    if (ppEl) ppEl.textContent = pp == null ? "—" : `${Math.round(pp)}%`;

    const st = $("#stress-tier");
    const pt = $("#pace-tier");
    if (st) st.textContent = stress.refused ? "Demo refused" : tierName(stress.tier) || "—";
    if (pt) pt.textContent = tierName(pace.tier) || "—";

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

    const sb = $("#stress-btn");
    const pb = $("#pace-btn");
    const stressChip = $("#stress-chip");
    const paceChip = $("#pace-chip");
    if (stressChip) stressChip.textContent = severityLabel(sp ?? 0);
    if (paceChip) paceChip.textContent = severityLabel(pp ?? 0);
    if (sb) {
      sb.setAttribute("aria-label", `Stress clock ${sp == null ? "unavailable" : Math.round(sp) + " percent"}. Open provenance.`);
      if (sp != null) sb.title = `Stress ${Math.round(sp)}%. Fear thermometer. Click for who flinched.`;
    }
    if (pb) {
      pb.setAttribute("aria-label", `Pace clock ${pp == null ? "unavailable" : Math.round(pp) + " percent"}. Open provenance.`);
      if (pp != null) pb.title = `Pace ${Math.round(pp)}%. How fast the future is jogging. Click for the spine.`;
    }
  }

  function domainIds(domains) {
    const ids = DOMAIN_ORDER.filter((id) => domains[id]);
    Object.keys(domains).forEach((id) => {
      if (!ids.includes(id)) ids.push(id);
    });
    return ids;
  }

  function subsOf(domain) {
    const subs = domain && domain.subs;
    if (!subs) return [];
    if (Array.isArray(subs)) return subs.filter(Boolean);
    return Object.values(subs).filter(Boolean);
  }

  function renderClockWall(data) {
    const root = $("#clock-wall");
    if (!root) return;
    const domains = data.domains || {};
    const ids = domainIds(domains);
    if (!ids.length) {
      root.innerHTML = `<p class="muted">The shelves came back empty. The big clocks upstairs still have opinions.</p>`;
      return;
    }
    root.innerHTML = ids
      .map((id) => {
        const d = domains[id];
        if (!d) return "";
        const mark = DOMAIN_MARK[id] || "·";
        const clocks = subsOf(d)
          .map((s) => {
            const label = s.clockLabel || s.name || s.id || "dial";
            const sev = severityClass(s.pct);
            const tier = tierName(s.tier);
            const conf = typeof s.confidence === "number" ? `conf ${s.confidence}%` : "";
            const stale =
              s.staleness && s.staleness.badge
                ? `<div class="clock-conf">${escapeHtml(s.staleness.badge)}</div>`
                : "";
            return `<button type="button" class="doom-clock sub-dial ${sev}" data-provenance="dial" data-domain="${escapeAttr(id)}" data-sub="${escapeAttr(s.id || "")}" title="${escapeAttr(label)} · ${s.pct ?? "—"}%. Receipts inside." aria-label="${escapeAttr(label)} ${s.pct ?? "—"} percent. Open provenance.">
              <span class="clock-face">${clockSvg(s.pct, { size: 112 })}</span>
              <span class="clock-label">${escapeHtml(label)}</span>
              <span class="clock-pct-big">${s.pct ?? "—"}%</span>
              <span class="sev-chip">${escapeHtml(severityLabel(s.pct))}</span>
              ${tier ? `<span class="clock-tier">${escapeHtml(tier)}</span>` : ""}
              ${conf ? `<span class="clock-conf">${escapeHtml(conf)}</span>` : ""}
              ${stale}
            </button>`;
          })
          .join("");
        const weight =
          typeof d.weight === "number" ? `${(d.weight * 100).toFixed(0)}% of rollup` : "";
        return `<article class="shelf-panel" data-domain="${escapeAttr(id)}">
          <div class="shelf-poster">
            <div class="shelf-title">
              <div class="shelf-mark-row">
                <span class="shelf-brass">${escapeHtml(d.shelfLabel || d.name || id)}</span>
                <span class="shelf-mark" aria-hidden="true">${mark}</span>
                ${d.accent ? `<span class="shelf-accent">${escapeHtml(d.accent)}</span>` : ""}
              </div>
              <h2>${escapeHtml(d.name || id)}</h2>
            </div>
            <div class="shelf-meta">
              shelf <strong>${d.pct ?? "—"}%</strong><br/>
              ${escapeHtml([tierName(d.tier), weight, d.confidence != null ? `conf ${d.confidence}%` : ""].filter(Boolean).join(" · "))}
            </div>
          </div>
          <div class="shelf-body">
            ${d.blurb ? `<p class="shelf-blurb">${escapeHtml(d.blurb)}</p>` : ""}
            <div class="clock-grid">${clocks || `<p class="muted">This shelf is politely blank.</p>`}</div>
          </div>
        </article>`;
      })
      .join("");
  }

  function setGateNote(pred) {
    const gate = (pred && pred.gate) || "closed";
    const verdict = (pred && pred.verdict) || "no edge";
    const text =
      gate === "open"
        ? `Prediction edges · gate open · ${verdict} · still not prophecy`
        : `Prediction edges · gate closed · ${verdict} · the lobby declines to invent one`;
    const note = $("#pyramid-gate");
    if (note) {
      note.textContent = text;
      note.classList.toggle("open", gate === "open");
    }
    return { gate, verdict };
  }

  function renderPredictions(pred) {
    const gateEl = $("#pred-gate");
    const feed = $("#pred-feed");
    const { gate, verdict } = setGateNote(pred);
    if (!pred) {
      if (gateEl) gateEl.textContent = "Calibration gate · not on this snapshot";
      if (feed) feed.innerHTML = `<p class="muted">No prediction book in the bag. The gate can stay shut without one.</p>`;
      return;
    }
    if (gateEl) {
      gateEl.textContent = `Calibration gate · ${gate} · ${verdict}`;
      gateEl.classList.toggle("open", gate === "open");
    }
    const markets = pred.markets || [];
    if (!feed) return;
    if (!markets.length) {
      feed.innerHTML = `<p class="muted">The book is empty. Gate ${escapeHtml(gate)} · ${escapeHtml(verdict)}. Nobody gets to invent an edge.</p>`;
      return;
    }
    const edges = markets.filter((m) => m.edge);
    const shown = (edges.length ? edges : markets).slice(0, 8);
    feed.innerHTML =
      `<p class="muted tiny">${edges.length ? `${edges.length} edge(s) · the gate actually opened` : "No edges. The gate is being boring on purpose."} · showing ${shown.length} of ${markets.length}</p>` +
      shown
        .map((m) => {
          const q = escapeHtml(m.question || m.id || "market");
          const url = m.polymarketUrl
            ? `<a href="${escapeAttr(m.polymarketUrl)}" target="_blank" rel="noopener noreferrer">${q}</a>`
            : q;
          const yes = m.marketYes == null ? "—" : `${Math.round(Number(m.marketYes) * 1000) / 10}%`;
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
      el.innerHTML = `<p class="muted">The health chart didn’t make the trip. Each clock still brought its own sources in the drawer.</p>`;
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
    renderMaster(data);
    renderApex(data);
    renderPair(data);
    renderClockWall(data);
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
