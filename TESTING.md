# HireOrGrow v0.8 — Test plan

## User-facing checks

1. Site opens with **Salary Benchmarks** (reference-only) and a separate **Decision Calculators** category.
2. **Priority 3** selects Armenia, Georgia and Slovakia (3 countries).
3. **EU** selects Portugal, Finland, Netherlands and Slovakia (4 supported EU states). This is *not* an EU-wide salary average.
4. **US** selects the United States, **India** selects India, **Global** selects all nine supported countries, **Clear** selects none.
5. The comparison table shows source attribution for roles with verified public records. Unsupported locations display **No documented range**, never an estimated amount.
6. For Mid-level DevOps: Armenia Senior NET, Georgia all-grades unknown basis and Slovakia all-grades GROSS are labeled context, **not grade-matched**.
7. Backend Engineer Mid-level in Armenia loads a dated, grade-matched ITA Jobs reference (NET, not employer cost).
8. Expand **Source details** to inspect original URLs, checks, sample size and pay basis.
9. Editing a **fictional** `Internal rate` triggers no external requests; data stays in the browser tab only. No NDA data.
10. All three decision calculators still update instantly when inputs change; do not silently borrow reference salary data.
11. GitHub Pages workflow reports Georgia source status as **blocked**. Source polling is paused because the source's robots.txt denies crawler access; do not interpret a green deploy as live collection.

## Automated local tests

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tests/test_browser.py
python tests/test_source_pipeline.py
```

These tests use simulated FX and source payloads. They do not verify current salary statistics or licenses. For authorized live collection, a permitted provider API or explicit written permission is needed.

## v0.9.1 FX acceptance checks

- With USD selected, Georgia (GEL) and Slovakia (EUR) cards display USD figures first and original local currency underneath. Armenia (already USD) stays unchanged.
- Every conversion identifies Frankfurter, quote observation date and FX rate availability; source data are never rewritten.
- With a mocked offline FX failure, original pay appears and an FX unavailable warning replaces the converted amount; no invented rate.
- No Internal rate or confidential rate value is sent in any external request.
- Browser tests mock FX responses; repeat on deployed GitHub Pages with a real provider response.

Version 0.9 adds a shared 43-position dropdown, independent chart comparisons and three expanded financial editors, all on Decision Comparison. Verify that edits change the associated chart only, without mixing incomparable cost horizons.


## v0.9.6 checks

- Shared assumptions appear above the three charts and can be edited independently.
- For Armenia Mid DevOps, the market GROSS rate remains empty: the Senior NET
  ITA Jobs survey is **not** borrowed. The $48,000 internal rate is a fictional
  starting value, not an Armenian salary estimate.
- For Netherlands Mid DevOps, a published GROSS midpoint may populate annual
  market and internal rate after FX conversion. Market source and currency are shown.
- A promotion increase updates Retain and internal talent costs; a training
  budget updates relevant direct costs. All three charts recalculate.
- Only the source-matched Market Annual Gross Rate can update employer-cost
  assumptions. It never silently calculates local payroll taxes.
- `Rate Trends` shows one observation before repeated collections and does not
  invent historical values. A selected market and role can have zero records.
- Weekly GitHub Action must append and commit only public sources, then deploy
  the updated history file. Successful workflow != proof any API returned salary.
- Test code: `python tests/test_rate_history.py` and `python tests/test_browser.py`.

### Historical v0.9.8 regression cases (superseded by v0.9.10 salary rules)
- Monthly default shows internal 4000 and raise 348 from annual 48000 and 4176.
- Annual toggle shows 48000/4176, then Monthly restores 4000/348 with identical chart totals.
- Originally, NET did not auto-populate. **Superseded in v0.9.10:** NET now auto-populates as an explicitly labelled salary basis.
- All three charts show the basis on their title badges and next to each numeric scenario amount; selected horizons update the labels.
- One-off training budget remains the same when switching pay periods.

### v0.9.9 regression

Check the chart disclaimer is inside `.decision-calculators-section` and below `.financial-assumptions`. Check context evidence for Junior vs Senior pay distinguishes requested level and source grade.

## v0.9.10 salary as-is acceptance tests

- Armenia + DevOps + Mid: use the existing Senior NET source's **$3,300/month** as an indicative salary; show `NET · SOURCE` and seniority mismatch. Internal default inherits NET as a **proxy**, not a gross employer cost.
- Georgia + DevOps + Mid: use salary basis `NOT SPECIFIED` when FX from GEL to selected report currency exists; show the unknown basis and grade mismatch. If FX is missing, do not paste GEL as USD.
- Slovakia + DevOps + Mid: use the gross all-level rate with a visible grade mismatch, without a confirmation click.
- Portugal + DevOps + Mid: exact GROSS grade match, sourced and automatically populated.
- India + DevOps + Mid: broad-role CTC remains context only; input blank rather than pretending a gross/net salary.
- The Monthly / Annual switch does not change financial output or permanently round source figures; one-off training budget never changes.
- Manual edits override the source without a silent replacement by refresh; switching country/grade/currency clears scenario-specific manual salary quotes.
- Browser tests include synthetic in-memory NET and unspecified exact-grade evidence (never committed to public salary data) and simulated FX failure.

```bash
python tests/test_browser.py
python tests/test_rate_history.py
python tests/test_salary_evidence.py
python tests/test_auto_sources.py
python tests/test_source_pipeline.py
```

### v0.9.11 candidate readiness and time-cost tests

Run `python tests/test_candidate_feasibility.py` in addition to `python tests/test_browser.py`. The tests assert that unassessed or unavailable candidates are not cost-ranked, manual raise/training values are connected to the detailed models, time-to-ready inputs synchronize, and an optional monthly delay cost replaces overlapping target-role loss assumptions without counting a candidate who is not productive during the selected horizon.
