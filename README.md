# HireOrGrow 0.7 — Priority Local Markets

**Hire smart. Grow smarter.**  
International talent cost & workforce decision prototype.

## What's new in 0.7

- **Priority markets:** Armenia, Georgia, Slovakia, selected by default in `Global Market Benchmark`.
- **Armenia (ITA Jobs):** dated, manually reviewed public DevOps salary survey. **Senior / net**, not a Mid-level estimate.
- **Georgia (Fairpay):** dated, manually reviewed DevOps self-reported salaries. **All grades / net-gross unspecified / small sample**.
- **Slovakia (Platy.sk):** dated, manually reviewed DevOps salary survey. **All grades / gross**.
- **Georgia (findjobs.ge):** a *scheduled* GitHub Actions collector for publicly crawlable, pay-disclosing Georgian job ads. Ads are displayed individually, not mixed with survey salaries. A role-level median is only produced when at least eight local listings disclose usable **monthly GEL** salary. **No grade-specific median** is inferred.
- `Internal rate`: manual, in-memory, excluded from third-party requests. No uploaded employee lists or company rate cards.

**This is a prototype with source attribution, not a licensed compensation platform or an HR decision system.** There are no claims that all three markets have automated live salary surveys. **Only the Georgian vacancies are eligible for scheduled automatic updates.** Dated reference data require manual re-verification or appropriately licensed feeds.

## Sources and caveats

| Country | Source | Data in app | Accuracy caveat |
|---|---|---|---|
| Armenia | [ITA Jobs](https://jobs.ita.am/roles/devops-engineer) | Senior DevOps, USD **net/month**, last source update 2026-11-09 | 10 submissions; no published Mid-level estimate |
| Georgia | [Fairpay](https://www.fairpay.ge/positions/devops-engineer) | DevOps across **all grades**, GEL/month | Six self-reports; pay basis not established; no licensed API |
| Georgia | [findjobs.ge crawler JSON](https://findjobs.ge/crawl/en/) | Public active Georgian ads with job title, location, salary and link | Ads with no salary omitted; hourly/daily and global remote ads excluded; net/gross unknown |
| Slovakia | [Platy.sk](https://www.platy.sk/en/platy/information-technology/devops-engineer) | DevOps, EUR **gross/month**, central 80% across grades | Not a Mid-level estimate; API access is [commercial](https://www.paylab.com/paylab-api) |

Original publication date, source verification date, source link, currency, basis, population and sample size are included in the UI where known. Public reference numbers are manually checked as of **2026-11-18**, not live; they can grow stale.

## Installation / publishing (important)

1. Download the 0.7 ZIP, unzip it locally.
2. Upload the **contents** to the root of [`SiTa-82/HireOrGrow`](https://github.com/SiTa-82/HireOrGrow) using **Add file → Upload files**. Confirm `index.html`, `app.js`, `market.js`, `styles.css`, `data/`, `scripts/` and `.github/workflows/market-data.yml` are present at their correct paths. Commit changes.
3. **Switch GitHub Pages from the old branch deployment to GitHub Actions:** **Settings → Pages → Build and deployment → Source → GitHub Actions**. Otherwise the scheduled collector cannot deploy the generated JSON. The default `main` branch is still used for source code, but Pages is deployed by workflow artifact.
4. Open **Actions → Publish HireOrGrow with updated Georgia vacancy data → Run workflow → main → Run workflow** to trigger the initial collection/deployment. Subsequent runs occur automatically at **07:23 UTC on weekdays** and when `main` changes. Check the **Actions** logs for errors.
5. Open [HireOrGrow on GitHub Pages](https://sita-82.github.io/HireOrGrow/) and go to **Global Market Benchmark → Priority 3**. Verify the sources and the Georgian feed status.

If the Georgian source is unavailable or robots.txt disallows collection, the collector publishes an explicit `unavailable` status, **not invented salary numbers**. The survey snapshots still load. The browser's **Reload published market data** button reloads JSON that GitHub has published; it does **not** run GitHub Actions instantly.

## What GitHub Actions does

`market-data.yml` executes `scripts/update_georgia.py` without any credentials, collects the open researcher JSON at `findjobs.ge` (observing robots.txt and rate limits), validates salary period/currency and occupation, writes `data/georgia_live.json`, then publishes a static GitHub Pages artifact. The workflow does **not** commit generated data to git. Raw listings, applicant information and private company data are not stored. The published file contains only job titles, employer names, approximate pay, dates, grades, cities and links.

## Testing

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tests/test_source_pipeline.py
python tests/test_browser.py
```

The tests use **fictional job listings and mocked FX data**, not an actual source connection. For live validation check the first manual GitHub Actions run, the deployed `/data/georgia_live.json`, and compare two sample job links against the source. The application's financial calculators remain available.

## Security

- All published source files and GitHub Pages HTML are **public**.
- Do **not** use internal salaries, NDA rate cards, personal employee information or client data in this demo.
- `Internal rate` stays in page memory; copying, printing and browser extensions can expose data, so use fictional amounts only.
- Only the optional FX fetch sends currency codes to `api.frankfurter.dev`; salary source JSON is served by the same GitHub Pages origin.
- No user database, corporate SSO, encryption-at-rest guarantee, audit trail or production security approval.

See `SECURITY.md` and `TESTING.md`.
