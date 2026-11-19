# HireOrGrow v0.9.10 — GitHub Actions / Pages hotfix

This hotfix changes **only** `.github/workflows/market-data.yml` in the app.
No salary logic, input defaults, styling, or UI code is altered.

## Why

- The earlier workflow still called `scripts/update_georgia.py`, a crawler whose
  robots.txt access was already marked blocked. The old file is retained as a
  historical reference but is no longer scheduled.
- `market.js` requests *four* JSON files, while the old workflow deployed only
  two. `automatic_market.json` and `rate_history.json` were omitted from Pages.
- Checkout/setup-python use Node 24-compatible actions in the new workflow.
- The new workflow adds explicit file validation and a build summary.
- On push, deploy immediately using committed public evidence. On scheduled
  (Monday 07:23 UTC) and manual runs, it also calls the existing authorized
  API collector and appends historical observations. Push-back is best effort,
  allowing deployment even when branch write permissions are restricted.

## Install (GitHub web interface)

1. Open `SiTa-82/HireOrGrow` → **Code** → `.github/workflows/market-data.yml`.
2. Click the pencil **Edit this file**.
3. Replace its complete contents with the hotfix file's contents, then
   **Commit changes** to `main`.
4. Open **Settings → Pages → Build and deployment → Source**. Choose
   **GitHub Actions** (not "Deploy from a branch").
5. Open **Actions → Publish HireOrGrow and refresh public market evidence**
   and inspect the new run. If it is red, expand `collect-and-publish` and
   send the first failed step and its full error text.

## Notes

This change repairs confirmed build omissions and updates outdated action
versions, but the screenshot/email did **not** include the failed step logs.
An unrelated Pages permission/configuration problem could still block publishing.
The first successful new push publishes *existing* public JSON. Manual/scheduled
runs attempt refreshed API evidence and rate history. A successful workflow
is **not** evidence that external sources supplied new salaries.

For Android, editing the single workflow in GitHub's web editor is usually
simpler than uploading hidden `.github` directories from a ZIP.
