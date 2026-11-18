# TalentCost 0.5 — Live market benchmarking demo

**English-language Talent Acquisition cost-decision prototype with automatic public salary queries.** It is a proof of concept, **not an approved HR or compensation system**.

## Modules

1. **Cost to Fill** — external vs internal hiring one-off costs.
2. **Retain vs Replace** — estimated retention versus replacement economics.
3. **Internal Talent** — external hire, promotion and reskilling with backfill, incremental payroll and transition losses.
4. **Global Market Benchmark** — live public country salary estimates, optionally compared with a manually entered `Internal rate`.

## How data are sourced, shown and refreshed

| Source | Requested data | What appears in the app | Key limitation |
|---|---|---|---|
| [SalaryByRole API](https://salarybyrole.com/data/api) | HTTPS GET with `role` and `country` | The **exact salary range**, provider median, currency, role, level, data-generation date, reference year, provider-reported underlying sources, direct API/source link and CC BY 4.0 attribution **on each country card** | Aggregated salary estimates, not observed hiring offers; pay basis and representativeness require verification. Some country / role pairs may have no data. |
| [Jobicy Jobs API](https://jobicy.com/jobs-rss-feed) | HTTPS GET with public job-title keyword | Recent remote job ads with disclosed pay, original salary unit, employer, location eligibility, publication date and **a link to each listing** | Remote-ad salary is **not** a country salary benchmark; postings are shown separately. |
| [Frankfurter FX API](https://frankfurter.dev/javascript/) | HTTPS GET with `base=usd` | The dated exchange rate on each currency conversion; original salaries always remain visible | FX conversion is not purchasing-power parity or local employer cost. |

External data refresh automatically when opening the Market tab or changing position, seniority and countries. You can also press **Refresh live market data**. Successful salary responses are cached **in memory only** for 30 minutes; manual Refresh bypasses the cache. Jobicy requests are cached in-memory for 60 minutes; no background daemon or API keys. Failed connections are reported explicitly, not replaced by made-up salaries.

## Countries

The selectors include **Armenia, Georgia, Portugal, Kazakhstan, Finland, Slovakia** plus Germany, Netherlands, Poland, Spain, Greece, the United States, United Kingdom, Singapore and India.

Market presets: **EU** (eight listed EU countries), **US**, **Global** (all 15 countries), **Custom** and **Clear**. These are country sets, **not fabricated regional-average salaries**.

`Internal rate` is a **manually entered, optional** figure. Enter a gross base-pay estimate if you want an indicative like-for-like comparison. You can choose annual, monthly, or hourly basis, currency and country. If the figure is a billing/client rate, select that type and the tool **will not calculate a salary percentage gap**. The private input stays in page memory and is **not added to any HTTP request**. Copy and Print deliberately include it if entered, so use demo data only.

## Run locally

Start a static server in the directory containing `index.html`, `styles.css`, and `app.js`:

```bash
python -m http.server 8000
```

Browse to <http://localhost:8000>. Direct `file://` opening may work but is less reliable for browser security restrictions. **Internet access is required for live feeds.**

## Publish to GitHub Pages

Create a GitHub repository (e.g., `talentcost-demo`), upload **the contents of this folder** into the repository root, then enable **Settings → Pages → Deploy from branch → main → /(root)**. GitHub Pages is a public site in normal setups — keep source code and sample inputs free from secrets or NDA data.

## Test

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tests/test_browser.py
```

The browser smoke test **mocks** the three public APIs, verifies the finance modules, SalaryByRole source/date attribution, EU/US/Global selection, FX and Jobicy results, internal-rate privacy boundaries, and a salary-provider outage without invented fallback data. Mocked tests are not proof that provider APIs and CORS are available from your deployed site; test those live after deployment.

## Privacy and security

No employee database, login, collection server, tracking script, or persistent storage. Calls from the Market tab send the **public role and country** to SalaryByRole, a role keyword to Jobicy, and currency codes to Frankfurter; all providers also see typical network metadata. `Internal rate` stays in browser memory but is accessible to the local device/browser environment and may appear in copied / printed reports. **Do not enter any real employee pay, NDA-protected rates, internal company rate cards or personal data.** See `SECURITY.md`.

**Accuracy caveat:** `Employer overhead, %` is only a user-defined approximation; it does **not** calculate local employer taxes. The other finance calculators accept manual currency labels and do **not** convert those values to local rates.
