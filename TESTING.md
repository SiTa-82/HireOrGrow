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

### v0.9.8 regression cases
- Monthly default shows internal 4000 and raise 348 from annual 48000 and 4176.
- Annual toggle shows 48000/4176, then Monthly restores 4000/348 with identical chart totals.
- Existing monthly-gross salary records match the corresponding country/role/level and normalize to annual; NET never auto-populates market gross.
- All three charts show the basis on their title badges and next to each numeric scenario amount; selected horizons update the labels.
- One-off training budget remains the same when switching pay periods.

### v0.9.9 regression

Check the chart disclaimer is inside `.decision-calculators-section` and below `.financial-assumptions`. Check context evidence for Junior vs Senior pay distinguishes requested level and source grade.
