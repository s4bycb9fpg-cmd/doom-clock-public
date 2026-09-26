# DOOM INDEX · Public Mirror

Static, read-only public mirror of Josh’s private Doom Dashboard board.

Visitors see the **last published snapshot** as a pyramid clock wall: blend master, Stress and Pace, then domain shelves of named sub-dials, plus the apex spine, Polymarket gate status, and driver provenance. Nothing on this site scans, scrapes, or posts.

## Private vs public

| | Private (`doom-dashboard`) | Public (`doom-public-mirror`) |
|---|---|---|
| Runtime | Express on `:3847` | Static files only |
| Data | Live scan cache + scrapers | One `public-board.json` |
| Scan | `POST /api/scan` (manual / brief-driven) | **None** |
| Secrets / keys | Stay on the private box | Never shipped |
| Provenance | Trust drawer on Stress / Pace / blend / dials | Same drawer idea, snapshot drivers only |
| Auto-scan | Off (do not re-enable 12‑min auto-scan) | N/A |

The private app is the source of truth. This mirror is a cold steel lobby display: whatever you last published is what the public sees.

## What’s on the board

- **Stress %** — confirmation-gated cyber / conflict / infra / bio heat
- **Pace %** — apex spine (Recursive AI / AGI-here / closed-loop) + dial haircuts + lab-primary pins
- **Blend** — `0.55×Stress + 0.45×Pace`, labeled **blend, not prophecy**
- **publishedAt** — when this snapshot was exported
- **Apex spine** — with stale badge when the apex file is old
- **Polymarket gate** — closed / no edges unless the private board says otherwise
- **sourceHealthSummary** — if present on the snapshot; otherwise a note that it wasn’t exported
- **Pyramid** — master blend clock, then Stress + Pace, then widening domain shelves (`domains.*.subs`)
- **Provenance drawer** — click the master, Stress, Pace, or any shelf dial for title / source / tier / evidence / decayHint / outbound link

## Refresh workflow

1. On the private box, refresh the board when you mean to:

   ```bash
   curl -s -X POST http://localhost:3847/api/scan
   ```

2. Slim + write the public snapshot (from this mirror directory):

   ```bash
   ./publish-from-private.sh
   ```

   Or overwrite by hand:

   ```bash
   # after a private POST /api/scan
   cp /path/to/fresh/public-board.json ./public-board.json
   cp ./public-board.json ./data/public-board.json
   ```

3. Redeploy the static site (see `DEPLOY.md`).

The UI only `fetch`es `public-board.json` (fallback: `data/public-board.json`). No API, no Express, no scrapers.

## Local preview

From this repository root (the GitHub Pages site root):

```bash
npx --yes serve -l 3850 .
# or: python3 -m http.server 3850
```

Open http://localhost:3850

## GitHub Pages

This repo is the static site. After Settings → Pages → **Deploy from a branch** → `main` / **(root)**, the mirror is at:

https://s4bycb9fpg-cmd.github.io/doom-clock-public/

See `DEPLOY.md`.

## Disclaimer

Personal research signal board. Blend is not prophecy. Not financial, legal, or safety advice.
