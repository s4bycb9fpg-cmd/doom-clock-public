#!/usr/bin/env bash
# Slim private GET /api/board → public-board.json (static mirror schema).
# For Josh’s box: private doom-dashboard on localhost:3847.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="${ROOT}/public-board.json"
OUT2="${ROOT}/data/public-board.json"
API="${DOOM_PRIVATE_API:-http://127.0.0.1:3847/api/board}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

echo "Fetching ${API} …" >&2
if ! curl -fsS --max-time 60 "${API}" -o "$TMP"; then
  echo "ERROR: could not reach private /api/board at ${API}" >&2
  echo "Start doom-dashboard (port 3847) and POST /api/scan first." >&2
  exit 1
fi

python3 - "$TMP" "$OUT" "$OUT2" <<'PY'
import json, sys
from datetime import datetime, timezone

src_path, out_path, out2_path = sys.argv[1:4]
raw = json.load(open(src_path))

def pick_driver(d):
    if not isinstance(d, dict):
        return None
    return {
        "title": d.get("title"),
        "source": d.get("source"),
        "link": d.get("link") or d.get("url"),
        "publishedAt": d.get("publishedAt"),
        "evidence": d.get("evidence"),
        "sourceTier": d.get("sourceTier"),
        "impact": d.get("impact"),
        "effectiveImpact": d.get("effectiveImpact"),
        "polarity": d.get("polarity"),
        "clusterSize": d.get("clusterSize"),
        "decayFactor": d.get("decayFactor"),
        "decayHint": d.get("decayHint"),
        "bodyConfirmed": d.get("bodyConfirmed"),
    }

def slim_drivers(lst, n=8):
    out = []
    for d in (lst or [])[:n]:
        p = pick_driver(d)
        if p and p.get("title"):
            out.append(p)
    return out

def slim_apex_sources(lst, n=5):
    out = []
    for s in (lst or [])[:n]:
        if not isinstance(s, dict):
            continue
        out.append({
            "title": s.get("title"),
            "url": s.get("url"),
            "publisher": s.get("publisher"),
            "publishedAt": s.get("publishedAt"),
            "measurementAsOf": s.get("measurementAsOf"),
            "role": s.get("role"),
            "keyFacts": (s.get("keyFacts") or [])[:6],
        })
    return out

def slim_markets(markets, n=16):
    out = []
    for m in (markets or [])[:n]:
        if not isinstance(m, dict):
            continue
        out.append({
            "id": m.get("id"),
            "question": m.get("question"),
            "polymarketUrl": m.get("polymarketUrl") or m.get("url"),
            "slug": m.get("slug"),
            "ourP": m.get("ourP"),
            "marketYes": m.get("marketYes"),
            "gapPoints": m.get("gapPoints"),
            "call": m.get("call"),
            "edge": bool(m.get("edge")),
            "reason": m.get("reason"),
            "family": m.get("family"),
            "primary": m.get("primary"),
            "sources": m.get("sources") or [],
            "openedAt": m.get("openedAt"),
            "resolvedAt": m.get("resolvedAt"),
            "outcome": m.get("outcome"),
        })
    return out

def slim_sub(s):
    if not isinstance(s, dict):
        return None
    tier = s.get("tier")
    return {
        "id": s.get("id"),
        "name": s.get("name"),
        "clockLabel": s.get("clockLabel"),
        "pct": s.get("pct"),
        "tier": tier if isinstance(tier, (dict, str)) else None,
        "confidence": s.get("confidence"),
        "weight": s.get("weight"),
        "rationale": s.get("rationale"),
        "methodNotes": s.get("methodNotes"),
        "lastSignalAt": s.get("lastSignalAt"),
        "staleness": s.get("staleness"),
        "scoreParts": s.get("scoreParts"),
        "confirmation": s.get("confirmation"),
        "drivers": slim_drivers(s.get("drivers") or s.get("signals"), n=6),
    }

def slim_domains(domains):
    out = {}
    if not isinstance(domains, dict):
        return out
    for did, d in domains.items():
        if not isinstance(d, dict):
            continue
        subs_in = d.get("subs") or {}
        subs = {}
        if isinstance(subs_in, dict):
            pairs = subs_in.items()
        elif isinstance(subs_in, list):
            pairs = ((s.get("id"), s) for s in subs_in if isinstance(s, dict))
        else:
            pairs = ()
        for sid, s in pairs:
            slim = slim_sub(s)
            if not slim:
                continue
            key = slim.get("id") or sid
            if key:
                subs[key] = slim
        out[did] = {
            "id": d.get("id") or did,
            "name": d.get("name"),
            "shelfLabel": d.get("shelfLabel"),
            "accent": d.get("accent"),
            "blurb": d.get("blurb"),
            "pct": d.get("pct"),
            "weight": d.get("weight"),
            "confidence": d.get("confidence"),
            "tier": d.get("tier") if isinstance(d.get("tier"), (dict, str)) else None,
            "subs": subs,
        }
    return out

overall = raw.get("overall") if isinstance(raw.get("overall"), dict) else {}
stress = raw.get("stress") or {}
pace = raw.get("pace") or {}
blend = raw.get("blend") or {}
apex = raw.get("apex") or {}
pred = raw.get("predictions") or {}
legacy = raw.get("legacyOverall")

# Prefer scan-level summary if board/scan ever expose it
health = raw.get("sourceHealthSummary")
if health is None and isinstance(raw.get("sourceHealth"), list):
    rows = raw["sourceHealth"]
    ok = sum(1 for r in rows if r and r.get("ok") is True)
    fail = sum(1 for r in rows if r and r.get("ok") is False)
    health = {"ok": ok, "fail": fail, "total": len(rows), "note": "slimmed from sourceHealth"}

published = raw.get("publishedAt") or raw.get("lastUpdated") or raw.get("computedAt")
if not published:
    published = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

public = {
    "publishedAt": published,
    "mode": raw.get("mode") or "live",
    "disclaimer": raw.get("disclaimer")
        or "Personal research signal board. Blend is not prophecy. Not financial, legal, or safety advice.",
    "stress": {
        "pct": stress.get("pct"),
        "tier": stress.get("tier"),
        "line": stress.get("line"),
        "drivers": slim_drivers(stress.get("drivers")),
        "computedAt": stress.get("computedAt"),
        "confidence": stress.get("confidence"),
        "scoreParts": stress.get("scoreParts"),
        "eligibleCount": stress.get("eligibleCount"),
        "methodNotes": stress.get("methodNotes"),
        "refused": bool(stress.get("refused")),
    },
    "pace": {
        "pct": pace.get("pct"),
        "tier": pace.get("tier"),
        "line": pace.get("line"),
        "recursiveAiPct": pace.get("recursiveAiPct"),
        "agiHerePct": pace.get("agiHerePct"),
        "closedLoopPct": pace.get("closedLoopPct"),
        "dialPct": pace.get("dialPct"),
        "apexPace": pace.get("apexPace"),
        "primaryBoost": pace.get("primaryBoost"),
        "freshReleaseBoost": pace.get("freshReleaseBoost"),
        "freshBoost": pace.get("freshBoost"),
        "dialParts": pace.get("dialParts"),
        "drivers": slim_drivers(pace.get("drivers")),
        "computedAt": pace.get("computedAt"),
        "apexAsOf": pace.get("apexAsOf") or apex.get("asOf"),
        "apexUpdatedAt": pace.get("apexUpdatedAt") or apex.get("updatedAt"),
        "apexSources": slim_apex_sources(pace.get("apexSources") or apex.get("sources")),
        "apexNotes": pace.get("apexNotes") or apex.get("notes"),
        "apexConfidence": pace.get("apexConfidence") or apex.get("confidence"),
        "apexEstimates": pace.get("apexEstimates") or apex.get("estimates"),
        "apexStale": pace.get("apexStale") if pace.get("apexStale") is not None else apex.get("stale"),
        "apexStaleDays": pace.get("apexStaleDays") if pace.get("apexStaleDays") is not None else apex.get("staleDays"),
        "methodNotes": pace.get("methodNotes"),
    },
    "blend": {
        "pct": blend.get("pct"),
        "formula": blend.get("formula") or "0.55×Stress + 0.45×Pace",
        "label": blend.get("label") or "board temperature (blend, not prophecy)",
        "tier": blend.get("tier"),
    },
    "apex": {
        "recursiveAi": apex.get("recursiveAi", pace.get("recursiveAiPct")),
        "agiHere": apex.get("agiHere", pace.get("agiHerePct")),
        "closedLoop": apex.get("closedLoop", pace.get("closedLoopPct")),
        "asOf": apex.get("asOf") or pace.get("apexAsOf"),
        "updatedAt": apex.get("updatedAt") or pace.get("apexUpdatedAt"),
        "sources": slim_apex_sources(apex.get("sources") or pace.get("apexSources")),
        "notes": apex.get("notes") or pace.get("apexNotes"),
        "confidence": apex.get("confidence") or pace.get("apexConfidence"),
        "estimates": apex.get("estimates") or pace.get("apexEstimates"),
        "stale": apex.get("stale") if apex.get("stale") is not None else pace.get("apexStale"),
        "staleDays": apex.get("staleDays") if apex.get("staleDays") is not None else pace.get("apexStaleDays"),
    },
    "formula": raw.get("formula"),
    "legacyOverall": legacy,
    "dialSnapshot": None,
    "movedNeedle": [],
    "changeSummary": None,
    "predictions": {
        "gate": pred.get("gate") or "closed",
        "verdict": pred.get("verdict") or "no edge",
        "markets": slim_markets(pred.get("markets")),
    },
    "sourceHealthSummary": health,
    "overall": {
        "pct": overall.get("pct"),
        "tier": overall.get("tier"),
        "line": overall.get("line"),
        "confidence": overall.get("confidence"),
    } if overall else None,
    "domains": slim_domains(raw.get("domains")),
    "lastUpdated": raw.get("lastUpdated") or published,
}

text = json.dumps(public, indent=2, ensure_ascii=False) + "\n"
open(out_path, "w").write(text)
import os
os.makedirs(os.path.dirname(out2_path), exist_ok=True)
open(out2_path, "w").write(text)
print(
    f"Wrote {out_path} and {out2_path} · "
    f"Stress {public['stress']['pct']}% · Pace {public['pace']['pct']}% · "
    f"blend {public['blend']['pct']}% · shelves {len(public.get('domains') or {})} · "
    f"gate {public['predictions']['gate']}"
)
PY
