# HireOrGrow v0.8 — Test plan

## User-facing checks

1. Site opens with **Market Intelligence** (reference-only) and a separate **Decision Calculators** category.
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
