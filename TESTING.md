# HireOrGrow 0.7 — Test checklist

## Automated (offline, fictional fixture)

1. `python tests/test_source_pipeline.py` — schemas, deduplication, role/grade matching, rejecting hourly, remote and missing-pay entries, and minimum-sample rule.
2. `python tests/test_browser.py` — all three financial calculators, Armenian/Georgian/Slovak source cards, dates and basis labels, EU/US/Global/Priority 3, manual internal rate does not initiate a request, and Georgia feed rendering with a *mocked* two-job sample.

These tests **do not** prove the real source can be reached or that its compensation numbers are accurate.

## Live GitHub acceptance

- [ ] `Settings → Pages → Source = GitHub Actions` is selected, after uploading the v0.7 files.
- [ ] `Actions → Publish HireOrGrow with updated Georgia vacancy data` completes (green).
- [ ] The deployed `/data/georgia_live.json` displays a real `status` and timestamp, not just the packaged `not_collected` seed.
- [ ] Armenia's ITA Jobs card states **Senior, NET, 10 answers** — not a Mid-level estimate.
- [ ] Georgia Fairpay card states **all grades, six self-reports, pay basis unknown**.
- [ ] Slovakia Platy.sk card states **all grades, gross, 324 verified respondents**.
- [ ] Clicking source links lands on the original country and occupation.
- [ ] Georgia's vacancy feed only includes relevant local postings with disclosed monthly GEL salaries; inspect at least two linked ads.
- [ ] If fewer than eight postings disclose pay, **no median** appears.
- [ ] Changing manual Internal rate does not include its value in Network requests.
- [ ] Job market data unavailable? An explicit warning appears, not a fabricated range.
- [ ] Other financial calculators produce same results as v0.6 and no JavaScript console errors.

## Known limits

Salary surveys for Armenia and Slovakia are **manual, dated snapshots**, not live API data. Net, gross, all-grade and grade-specific ranges cannot be treated as equivalent. Currency conversions are informative only; the demo does not calculate local employer taxes or cost of replacement from this tab.
