# HireOrGrow 0.6 — Browser testing checklist

## Automatic offline smoke test

`python tests/test_browser.py` uses Chromium and mocks live API responses. It does not need API credentials, real internal rates or live network access. It checks:

- Hire, Retain vs Replace and Internal Talent remain functional.
- Role + level + country lead to SalaryByRole request; amounts, source name, direct links, generated date and original currency are visible per card.
- Unsupported/no data cases are explicit; provider 500 response never produces a fake salary.
- Country presets include Armenia, Georgia, Portugal, Kazakhstan, Finland and Slovakia; EU excludes non-EU selections.
- Jobicy advertisements are separate from country salary cards, with listing links and publication dates.
- Frankfurter conversion is labeled by date, does not overwrite original currency.
- Entering/changing Internal rate does **not** trigger external requests or add the rate to request URLs; billing-rate type disables salary gap comparison.

## After GitHub Pages deployment (manual, using fictional values only)

1. Open **Global Market Benchmark** and select DevOps Engineer / Mid-level and Portugal.
2. Confirm the status leaves “Fetching” and the salary country card either shows a live value with source/updated-at details or states the source is unavailable/no data. Inspect Developer Tools → Network to see outbound API requests.
3. Switch to **Armenia, Georgia, Kazakhstan, Finland and Slovakia**. Missing-data countries must say so explicitly; do not infer from neighboring markets.
4. Select **EU**, **US**, **Global**, then **Custom**. Verify country selection. Note that the aggregate presets do not invent regional medians.
5. Enter a fictional `Internal rate`, e.g. 45,000 EUR annual gross in Portugal. Changing this field alone must not call any external provider. Select **Billing rate** and confirm comparison is disabled.
6. Change display currency; verify dated Frankfurter FX and unchanged original currency. If FX is blocked, the app must keep original numbers.
7. Confirm remote job ads, if present, have direct Jobicy source links and are visibly separated from country estimates.
8. Test mobile view and report copying/printing. Never include confidential data or screenshots of real employee pay in public Issues.

**Expected limitation:** Available salary coverage and the ability to reach the API from GitHub Pages depend on external providers. The local/mock tests cannot guarantee their production uptime or CORS behavior.
