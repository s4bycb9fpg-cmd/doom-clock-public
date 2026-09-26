# Deploy · DOOM INDEX public mirror

Simplest static hosts. Publish the **contents** of this directory (or the repo root if this folder *is* the site). The only dynamic piece is overwriting `public-board.json` after a private scan.

## Cloudflare Pages

1. Push this folder to a git repo (or upload assets).
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages**.
3. Connect the repo (or drag-and-drop direct upload).
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(empty)*
   - **Build output directory:** `/` (or `.` if the repo root is this mirror)
5. Deploy. After each private scan refresh, commit/overwrite `public-board.json` (+ `data/public-board.json`) and redeploy (or use Wrangler direct upload).

```bash
npx wrangler pages deploy . --project-name=doom-public-mirror
```

## Netlify

1. Netlify → **Add new site** → import repo or drag this folder.
2. Build settings:
   - **Build command:** *(empty)*
   - **Publish directory:** `.` (this folder)
3. Deploy. Refresh by replacing `public-board.json` and triggering a new deploy.

`netlify.toml` (optional):

```toml
[build]
  publish = "."
```

## GitHub Pages

Files in this repository already sit at the site root (`index.html`, `style.css`, `app.js`, `public-board.json`, empty `.nojekyll`).

1. Settings → Pages → Source: **Deploy from a branch**.
2. Branch: **main**. Folder: **/ (root)**.
3. After updating `public-board.json`, push; Pages rebuilds.

Published URL: https://s4bycb9fpg-cmd.github.io/doom-clock-public/

Relative asset paths (`style.css`, `app.js`, `public-board.json`) resolve from `index.html`, including when the site is served from a project subpath.

## Local preview

From the repository root:

```bash
npx --yes serve -l 3850 .
# alternate:
python3 -m http.server 3850
```

Then:

```bash
curl -s http://127.0.0.1:3850/ | head
curl -s http://127.0.0.1:3850/public-board.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['stress']['pct'], d['pace']['pct'], d['blend']['pct'])"
```

## Refresh + redeploy cheatsheet

```bash
# on private box
curl -s -X POST http://localhost:3847/api/scan >/dev/null
./publish-from-private.sh

# then push / wrangler / netlify deploy / whatever ships static files
```

No server process required in production. Do not point a public host at the private Express app.
