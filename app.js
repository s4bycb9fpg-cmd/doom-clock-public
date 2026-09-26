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

  function formatChecked(iso) {
    if (!iso) return "—";
    const match = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return fmtTime(iso);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[Number(match[2]) - 1];
    if (!month) return fmtTime(iso);
    let hour = Number(match[4]);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${month} ${Number(match[3])}, ${match[1]}, ${hour}:${match[5]} ${ampm}`;
  }

  function formatAsOf(raw) {
    const s = String(raw || "").trim();
    if (!s || s === "—") return "—";
    const month = s.match(/^(\d{4})-(\d{2})$/);
    if (month) {
      const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const idx = Number(month[2]) - 1;
      return idx >= 0 && idx < 12 ? `${names[idx]} ${month[1]}` : s;
    }
    return s;
  }

  function scoreFold(inner) {
    return `<details class="score-details"><summary>How this dial scores</summary><div class="score-details-body">${inner}</div></details>`;
  }

  function weightPct(w) {
    return typeof w === "number" ? `${(w * 100).toFixed(0)}%` : null;
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
      const stressDrivers = s.drivers || [];
      bodyEl.innerHTML = `
        <p class="trust-kicker">Trust drawer · Stress Index</p>
        <div class="trust-pct-row">
          <span class="trust-pct">${s.pct == null ? "—" : Math.round(s.pct)}</span>
          <span class="trust-tier">${escapeHtml(tierName(s.tier) || (s.refused ? "Demo refused" : "—"))}</span>
        </div>
        ${s.line ? `<p>${escapeHtml(s.line)}</p>` : ""}
        <h3>Top drivers</h3>
        ${provenanceDriversHtml(stressDrivers, 3)}
        ${scoreFold(`
          <pre class="trust-formula">${escapeHtml(
            s.methodNotes ||
              "Stress = confirmation-gated cyber+conflict+infra+bio incident heat. Body-confirmed or Tier A/B; remediation excluded; ~10d half-life; quiet floor ~7%; ±12 delta cap. Demo never feeds."
          )}</pre>
          ${
            s.refused
              ? `<p class="trust-banner warn">${escapeHtml(s.note || "Stress refuses demo seed.")}</p>`
              : gateBanner
          }
          ${
            stressDrivers.length > 3
              ? `<h3>More drivers</h3>${provenanceDriversHtml(stressDrivers.slice(3), 12)}`
              : ""
          }
          <p class="muted tiny">Computed ${escapeHtml(fmtTime(s.computedAt))} · eligible ${s.eligibleCount ?? "—"} · confidence ${s.confidence ?? "—"}%</p>
        `)}
      `;
    } else if (kind === "pace") {
      const p = data.pace || {};
      const apex = data.apex || {};
      const updated = p.apexUpdatedAt || apex.updatedAt || null;
      titleEl.textContent = `Provenance · Pace ${p.pct ?? "—"}%`;
      const asOfLabel = formatAsOf(p.apexAsOf || apex.asOf || "—");
      const measurementStale = p.apexStale || apex.stale;
      const spine = `
        <div class="apex-spine-grid" aria-label="Apex spine">
          <div class="apex-spine-cell"><span class="lbl">Recursive AI</span><span class="val">${p.recursiveAiPct ?? "—"}%</span></div>
          <div class="apex-spine-cell"><span class="lbl">AGI here</span><span class="val">${p.agiHerePct ?? "—"}%</span></div>
          <div class="apex-spine-cell"><span class="lbl">Closed-loop</span><span class="val">${p.closedLoopPct ?? "—"}%</span></div>
        </div>
        <p class="muted tiny">Measurement as-of ${escapeHtml(asOfLabel)} · last checked ${escapeHtml(
          formatChecked(updated)
        )} · dial shelf ${p.dialPct ?? "—"}% · apexPace ${p.apexPace ?? "—"}${
          measurementStale
            ? ` · <strong>measurement stale ${p.apexStaleDays ?? apex.staleDays ?? "?"}d</strong>`
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
      const paceDrivers = p.drivers || [];
      bodyEl.innerHTML = `
        <p class="trust-kicker">Trust drawer · Pace Index</p>
        <div class="trust-pct-row">
          <span class="trust-pct">${p.pct == null ? "—" : Math.round(p.pct)}</span>
          <span class="trust-tier">${escapeHtml(tierName(p.tier) || "—")}</span>
        </div>
        ${p.line ? `<p>${escapeHtml(p.line)}</p>` : ""}
        <h3>Top drivers</h3>
        ${provenanceDriversHtml(paceDrivers, 3)}
        ${scoreFold(`
          <pre class="trust-formula">${escapeHtml(
            p.methodNotes ||
              "Pace = 0.55×dial haircut + 0.45×apex spine (recursiveAi×1.15 + agiHere×0.55 + closedLoop×1.5) + primary/fresh boosts."
          )}</pre>
          ${gateBanner}
          <h3>Apex spine</h3>
          ${spine}
          <h3>Apex sources</h3>
          <ul class="prov-driver-list">${srcList || "<li class='muted tiny'>No apex sources packed. The spine is still a guess with a date on it.</li>"}</ul>
          ${
            paceDrivers.length > 3
              ? `<h3>More drivers</h3>${provenanceDriversHtml(paceDrivers.slice(3), 12)}`
              : ""
          }
          <p class="muted tiny">Computed ${escapeHtml(fmtTime(p.computedAt))} · primaryBoost ${p.primaryBoost ?? 0} · freshBoost ${p.freshBoost ?? 0} · freshReleaseBoost ${p.freshReleaseBoost ?? 0}</p>
        `)}
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
        <h3>Top drivers</h3>
        <ul class="prov-driver-list">
          <li class="prov-driver"><div>Stress ${s.pct ?? "—"}%</div><div class="prov-meta">${provChip(tierName(s.tier) || "stress")}${provChip("weight 0.55")}</div></li>
          <li class="prov-driver"><div>Pace ${p.pct ?? "—"}%</div><div class="prov-meta">${provChip(tierName(p.tier) || "pace")}${provChip("weight 0.45")}</div></li>
        </ul>
        ${scoreFold(`
          <pre class="trust-formula">${escapeHtml(b.formula || "0.55×Stress + 0.45×Pace")}
label: ${escapeHtml(b.label || "board temperature (blend, not prophecy)")}</pre>
          <p class="trust-banner"><strong>Blend is blend, not prophecy.</strong> A weighted mix of Stress and Pace for board temperature only. Not an AGI timeline, not a forecast, not a trade signal.</p>
          ${gateBanner}
          <div class="detail-stats">
            <span>legacy rollup ${o.pct ?? "—"}%${o.tier ? ` · ${escapeHtml(tierName(o.tier))}` : ""}</span>
            ${o.confidence != null ? `<span>rollup confidence ${escapeHtml(String(o.confidence))}%</span>` : ""}
          </div>
          ${o.line ? `<p class="muted tiny">Legacy domain rollup: ${escapeHtml(o.line)}</p>` : ""}
          <p class="muted tiny">The face is the blend. The engraved rollup is the shelves’ own argument.</p>
        `)}
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
      const dialDrivers = s.drivers || s.signals || [];
      const wSub = weightPct(s.weight);
      const wDom = d && weightPct(d.weight);
      const statBits = [
        s.confidence != null ? `<span>confidence ${escapeHtml(String(s.confidence))}%</span>` : "",
        wSub ? `<span>sub weight ${escapeHtml(wSub)}</span>` : "",
        wDom ? `<span>domain weight ${escapeHtml(wDom)}</span>` : "",
        d.pct != null ? `<span>shelf ${escapeHtml(String(d.pct))}%</span>` : "",
        s.lastSignalAt ? `<span>last signal ${fmtTime(s.lastSignalAt)}</span>` : "",
        conf.note ? `<span>${escapeHtml(conf.note)}</span>` : "",
        s.staleness && s.staleness.badge ? `<span>${escapeHtml(s.staleness.badge)}</span>` : "",
      ].filter(Boolean);
      bodyEl.innerHTML = `
        <p class="trust-kicker">Trust drawer · dial · ${escapeHtml(d.shelfLabel || d.name || domainId)}</p>
        <div class="trust-pct-row">
          <span class="trust-pct">${s.pct}</span>
          <span class="trust-tier">${escapeHtml(tierName(s.tier) || "—")}</span>
        </div>
        <p><strong>${escapeHtml(s.name || title)}</strong> on the <em>${escapeHtml(d.shelfLabel || d.name || "")}</em> shelf.</p>
        <h3>Top drivers</h3>
        ${provenanceDriversHtml(dialDrivers, 3)}
        ${scoreFold(`
          <pre class="trust-formula">${escapeHtml(formula)}</pre>
          ${gateBanner}
          ${statBits.length ? `<div class="detail-stats">${statBits.join("")}</div>` : ""}
          ${
            s.rationale
              ? `<div class="dossier-block"><h3 style="margin-top:0">Rationale</h3><p>${escapeHtml(s.rationale)}</p></div>`
              : ""
          }
          ${
            dialDrivers.length > 3
              ? `<h3>More drivers</h3>${provenanceDriversHtml(dialDrivers.slice(3), 12)}`
              : ""
          }
          ${s.methodNotes ? `<p class="muted tiny">${escapeHtml(s.methodNotes)}</p>` : ""}
        `)}
      `;
    } else {
      return;
    }

    const spoken = voiceTarget && voiceTarget.dataset.voice;
    if (spoken && bodyEl && !bodyEl.querySelector(".voice-aside")) {
      const aside = document.createElement("p");
      aside.className = "voice-aside";
      aside.textContent = spoken;
      bodyEl.insertBefore(aside, bodyEl.firstChild);
    }

    const drawer = $("#trust-drawer");
    if (drawer && typeof drawer.showModal === "function") drawer.showModal();
    hideVoiceCaption();
  }

  function voiceBand(pct) {
    const n = Number(pct);
    if (n >= 60) return "high";
    if (n >= 30) return "mid";
    return "low";
  }

  function voiceLine(kind, pct, name, tier) {
    const n = Math.round(Number(pct));
    if (!Number.isFinite(n)) return "";
    const band = voiceBand(n);
    const who = String(name || "This dial").replace(/\s+/g, " ").trim();
    const vibe = String(tier || "").replace(/\s+/g, " ").trim();
    const t = vibe ? `${vibe}. ` : "";
    const banks = {
      blend: {
        low: `Blend ${n}. ${t}A cool recipe. Not a prophecy.`,
        mid: `Blend ${n}. ${t}Warm enough to notice. Still two clocks in a coat.`,
        high: `Blend ${n}. ${t}The lobby stopped being casual. Still not Skynet.`,
      },
      stress: {
        low: `Stress ${n}. ${t}Ants, not a fire. The blanket survives.`,
        mid: `Stress ${n}. ${t}Someone noticed. Nobody is running.`,
        high: `Stress ${n}. ${t}Past picnic. The drawer has names.`,
      },
      pace: {
        low: `Pace ${n}. ${t}The future is strolling.`,
        mid: `Pace ${n}. ${t}Concern, with comfortable shoes.`,
        high: `Pace ${n}. ${t}The future is late, and slightly sweaty.`,
      },
      dial: {
        low: `${who}, ${n}. ${t}Mostly posture.`,
        mid: `${who}, ${n}. ${t}A reading, not a siren.`,
        high: `${who}, ${n}. ${t}This little dial is having a day.`,
      },
    };
    const bank = banks[kind] || banks.dial;
    return bank[band];
  }

  function attachVoice(el, kind, pct, name, tier) {
    if (!el) return;
    if (pct == null || !Number.isFinite(Number(pct))) {
      delete el.dataset.voice;
      return;
    }
    el.dataset.voice = voiceLine(kind, pct, name, tier);
    el.removeAttribute("title");
  }

  const VOICE_KEY = "doom-clock-voice";
  let voiceOn = true;
  let voiceTarget = null;

  function readVoicePref() {
    try {
      return localStorage.getItem(VOICE_KEY) !== "off";
    } catch {
      return true;
    }
  }

  function writeVoicePref(on) {
    try {
      localStorage.setItem(VOICE_KEY, on ? "on" : "off");
    } catch {
      /* private mode can refuse; the button still works this visit */
    }
  }

  function paintVoiceToggle() {
    const btn = $("#voice-toggle");
    if (!btn) return;
    btn.setAttribute("aria-pressed", voiceOn ? "true" : "false");
    btn.textContent = voiceOn ? "Voice on" : "Voice off";
    btn.title = voiceOn
      ? "Voice is on. Click a dial and it will say its line. Click here to mute."
      : "Voice is muted. Click a dial still opens the receipts, quietly. Click here to unmute.";
  }

  function cancelUtterance() {
    document.querySelectorAll(".doom-clock.is-speaking").forEach((el) => el.classList.remove("is-speaking"));
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch {
      /* some engines throw if the queue is already empty */
    }
  }

  function speakVoice(text, el) {
    if (!voiceOn || !text || !el) return;
    const synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance !== "function") return;
    try {
      const wasSpeaking = !!synth.speaking;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 1;
      utter.pitch = 0.96;
      const voices = synth.getVoices ? synth.getVoices() : [];
      const pick =
        voices.find((v) => /en-US/i.test(v.lang) && /natural|samantha|daniel|google/i.test(v.name)) ||
        voices.find((v) => /^en/i.test(v.lang));
      if (pick) utter.voice = pick;
      const done = () => el.classList.remove("is-speaking");
      utter.onend = done;
      utter.onerror = done;
      const start = () => {
        if (!voiceOn || voiceTarget !== el) {
          done();
          return;
        }
        try {
          if (typeof synth.resume === "function") synth.resume();
          synth.speak(utter);
        } catch {
          done();
        }
      };
      el.classList.add("is-speaking");
      // cancel() can swallow a speak() in the same turn once something is already talking
      if (wasSpeaking) setTimeout(start, 80);
      else start();
    } catch {
      el.classList.remove("is-speaking");
    }
  }

  const HINT_KEY = "doom-hover-hint";

  function hideVoiceCaption() {
    const cap = $("#voice-caption");
    if (cap) cap.hidden = true;
  }

  function showVoiceCaption(el) {
    const cap = $("#voice-caption");
    const text = el && el.dataset.voice;
    if (!cap || !text) {
      hideVoiceCaption();
      return;
    }
    cap.textContent = text;
    cap.hidden = false;
    const rect = el.getBoundingClientRect();
    const width = cap.offsetWidth || 220;
    const left = Math.min(window.innerWidth - width / 2 - 12, Math.max(width / 2 + 12, rect.left + rect.width / 2));
    let top = rect.bottom + 8;
    if (top + cap.offsetHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - cap.offsetHeight - 8);
    }
    cap.style.left = `${left}px`;
    cap.style.top = `${top}px`;
  }

  function bindHoverCaptions() {
    if (document.body.dataset.captionBound) return;
    document.body.dataset.captionBound = "1";
    document.body.addEventListener("pointerover", (e) => {
      const clock = e.target.closest && e.target.closest("[data-provenance]");
      if (clock) showVoiceCaption(clock);
    });
    document.body.addEventListener("pointerout", (e) => {
      const clock = e.target.closest && e.target.closest("[data-provenance]");
      if (!clock) return;
      const next = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest("[data-provenance]");
      if (next === clock) return;
      hideVoiceCaption();
    });
    document.body.addEventListener("focusin", (e) => {
      const clock = e.target.closest && e.target.closest("[data-provenance]");
      if (clock) showVoiceCaption(clock);
    });
    document.body.addEventListener("focusout", (e) => {
      const clock = e.target.closest && e.target.closest("[data-provenance]");
      if (!clock) return;
      const next = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest("[data-provenance]");
      if (next === clock) return;
      hideVoiceCaption();
    });
    window.addEventListener("scroll", hideVoiceCaption, true);
    const hint = $("#hover-hint");
    if (hint) {
      try {
        if (localStorage.getItem(HINT_KEY) === "off") hint.hidden = true;
      } catch {
        /* ignore */
      }
      const dismiss = $("#hover-hint-dismiss");
      if (dismiss) {
        dismiss.addEventListener("click", () => {
          hint.hidden = true;
          try {
            localStorage.setItem(HINT_KEY, "off");
          } catch {
            /* ignore */
          }
        });
      }
    }
  }

  function bindVoice() {
    if (document.body.dataset.voiceBound) return;
    document.body.dataset.voiceBound = "1";
    voiceOn = readVoicePref();
    paintVoiceToggle();
    const toggle = $("#voice-toggle");
    if (toggle) {
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        voiceOn = !voiceOn;
        writeVoicePref(voiceOn);
        paintVoiceToggle();
        if (!voiceOn) cancelUtterance();
      });
    }
    const drawer = $("#trust-drawer");
    if (drawer) {
      drawer.addEventListener("close", () => cancelUtterance());
    }
    if (window.speechSynthesis && typeof window.speechSynthesis.getVoices === "function") {
      window.speechSynthesis.getVoices();
    }
  }

  function speakClickedDial(el) {
    const text = el && el.dataset ? el.dataset.voice : "";
    if (!text) return "";
    if (voiceTarget && voiceTarget !== el) voiceTarget.classList.remove("is-speaking");
    voiceTarget = el;
    speakVoice(text, el);
    return text;
  }

  function bindProvenanceClicks() {
    if (document.body.dataset.provBound) return;
    document.body.dataset.provBound = "1";
    document.body.addEventListener("click", (e) => {
      const clock = e.target.closest("[data-provenance]");
      if (!clock) return;
      if (e.target.closest("a")) return;
      speakClickedDial(clock);
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

    const asOfLabel = formatAsOf(asOf);
    const staleBadge = $("#apex-stale-badge");
    if (staleBadge) {
      if (stale) {
        staleBadge.classList.remove("hidden");
        staleBadge.textContent = `measurement stale ${staleDays ?? "?"}d · as-of ${asOfLabel}`;
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
      meta.textContent = `as-of ${asOfLabel} · last checked ${formatChecked(
        pace.apexUpdatedAt || apex.updatedAt
      )} · closed-loop ${closed ?? "—"}%`;
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
      attachVoice(
        btn,
        typeof blend.pct === "number" ? "blend" : "dial",
        face,
        typeof blend.pct === "number" ? "Blend" : "Rollup",
        tierName(blend.tier) || tierName(overall.tier)
      );
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
      attachVoice(sb, "stress", sp, "Stress", tierName(stress.tier));
    }
    if (pb) {
      pb.setAttribute("aria-label", `Pace clock ${pp == null ? "unavailable" : Math.round(pp) + " percent"}. Open provenance.`);
      attachVoice(pb, "pace", pp, "Pace", tierName(pace.tier));
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
            return `<button type="button" class="doom-clock sub-dial ${sev}" data-provenance="dial" data-domain="${escapeAttr(id)}" data-sub="${escapeAttr(s.id || "")}" aria-label="${escapeAttr(label)} ${s.pct ?? "—"} percent. Open provenance.">
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
    root.querySelectorAll(".sub-dial").forEach((btn) => {
      const d = domains[btn.dataset.domain];
      const subs = d && d.subs;
      let s = null;
      if (subs && !Array.isArray(subs)) s = subs[btn.dataset.sub];
      if (!s && subs) {
        const list = Array.isArray(subs) ? subs : Object.values(subs);
        s = list.find((row) => row && row.id === btn.dataset.sub);
      }
      if (!s) return;
      attachVoice(btn, "dial", s.pct, s.clockLabel || s.name || s.id, tierName(s.tier));
    });
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

  function feedIsOk(row) {
    if (!row || typeof row !== "object") return false;
    if (row.ok === false) return false;
    if (row.ok === true) return true;
    return !row.error;
  }

  function tierSortKey(tier) {
    const t = String(tier || "").trim().toUpperCase();
    if (t === "A" || t.startsWith("A")) return 0;
    if (t === "B" || t.startsWith("B")) return 1;
    if (t === "C" || t.startsWith("C")) return 2;
    return 3;
  }

  function sortFeeds(feeds) {
    return feeds.slice().sort((a, b) => {
      const failA = feedIsOk(a) ? 1 : 0;
      const failB = feedIsOk(b) ? 1 : 0;
      if (failA !== failB) return failA - failB;
      const tierDelta = tierSortKey(a && a.tier) - tierSortKey(b && b.tier);
      if (tierDelta) return tierDelta;
      return String((a && (a.name || a.id)) || "").localeCompare(String((b && (b.name || b.id)) || ""));
    });
  }

  function clipText(value, max) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
  }

  function renderSourceHealth(summary, feedsFallback) {
    const el = $("#source-health");
    if (!el) return;
    const missing =
      (summary == null || summary === "") &&
      !(Array.isArray(feedsFallback) && feedsFallback.length);
    if (missing) {
      el.innerHTML = `<p class="muted">The health chart didn’t make the trip. When a snapshot packs source health, every feed shows its homework here. Until then, each clock still keeps receipts in the drawer.</p>`;
      return;
    }
    if (typeof summary === "string") {
      el.innerHTML = `<p>${escapeHtml(summary)}</p>`;
      return;
    }

    let rollup = null;
    let note = "";
    let feeds = [];
    if (Array.isArray(summary)) {
      feeds = summary;
    } else if (summary && typeof summary === "object") {
      rollup = summary;
      note = summary.note || "";
      if (Array.isArray(summary.feeds)) feeds = summary.feeds;
    }
    if (!feeds.length && Array.isArray(feedsFallback)) feeds = feedsFallback;
    if (!rollup && feeds.length) {
      const ok = feeds.filter(feedIsOk).length;
      rollup = { ok, fail: feeds.length - ok, total: feeds.length };
    }

    const chips = [];
    if (rollup && typeof rollup === "object") {
      if (rollup.ok != null) chips.push(`<span class="health-chip ok">ok ${escapeHtml(String(rollup.ok))}</span>`);
      if (rollup.fail != null) chips.push(`<span class="health-chip fail">fail ${escapeHtml(String(rollup.fail))}</span>`);
      if (rollup.total != null) chips.push(`<span class="health-chip">total ${escapeHtml(String(rollup.total))}</span>`);
      const byTier = rollup.byTier || {};
      ["A", "B", "C"].forEach((tier) => {
        const row = byTier[tier];
        if (!row || typeof row !== "object") return;
        const failBit = row.fail ? ` · ${escapeHtml(String(row.fail))} fail` : "";
        chips.push(
          `<span class="health-chip tier-${tier.toLowerCase()}">tier ${tier} · ${escapeHtml(String(row.ok ?? "—"))}/${escapeHtml(String(row.total ?? "—"))} ok${failBit}</span>`
        );
      });
    }

    const pills = sortFeeds(feeds)
      .map((row) => {
        const ok = feedIsOk(row);
        const name = escapeHtml((row && (row.name || row.id)) || "feed");
        const tier = row && row.tier ? escapeHtml(String(row.tier)) : "—";
        const count = row && row.count != null ? escapeHtml(String(row.count)) : "—";
        const ms = row && row.ms != null ? provChip(`${row.ms}ms`) : "";
        const err = !ok && row && row.error ? clipText(row.error, 160) : "";
        const title = err ? ` title="${escapeAttr(err)}"` : "";
        return `<div class="source-chip ${ok ? "ok" : "fail"}" role="listitem"${title}>
          <span class="feed-name">${name}</span>
          <span class="feed-meta">${provChip(`tier ${tier}`)}${ok ? provChip("ok") : provChip("down")}${provChip(`n=${count}`)}${ms}</span>
          ${err ? `<span class="feed-err">${escapeHtml(err)}</span>` : ""}
        </div>`;
      })
      .join("");

    if (!chips.length && !pills && !note) {
      el.innerHTML = `<p class="muted">Unrecognized source health shape. The clocks still keep their own receipts.</p>`;
      return;
    }

    el.innerHTML = `
      ${note ? `<p class="health-note">${escapeHtml(note)}</p>` : ""}
      ${chips.length ? `<div class="health-rollups">${chips.join("")}</div>` : ""}
      ${
        pills
          ? `<div class="source-grid" role="list">${pills}</div>`
          : `<p class="muted tiny">Rollup arrived without individual feeds. The counts above are the whole proof on this snapshot.</p>`
      }
    `;
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
    renderSourceHealth(data.sourceHealthSummary, data.sourceHealth);
    bindVoice();
    bindHoverCaptions();
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
