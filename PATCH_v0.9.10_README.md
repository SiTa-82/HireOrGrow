# HireOrGrow v0.9.10 — integrated NET/GROSS salary patch

## Files to upload

Extract the **QUICK_UPDATE** ZIP and upload its *contents* into the existing
GitHub repository root (`SiTa-82/HireOrGrow`), preserving the `tests/` folder.
Choose **Add file → Upload files** and commit to `main`.
Use the **UPLOAD_ROOT** ZIP only if replacing or rebuilding the entire repo.
Do **not** upload the ZIP itself into the repository, and do not create a
second nested `HireOrGrow-main/` directory. The published site uses GitHub Pages.

## What changed

- `app.js`: source salary matching and automatic use for NET / GROSS /
  unspecified, including explicit grade-mismatch caveat; CTC and family remain
  context only; manual edits stay scenario-specific; FX is required if the
  output currency is different from the source currency; calculator warnings.
- `index.html` + `styles.css`: visible salary basis labels and version 0.9.10.
- `market.js`: dataset cache key updated to avoid stale browser data.
- `tests/test_browser.py`: browser regression tests for matching and pay basis.
- `README.md`, `CHANGELOG.md`, `TESTING.md`: revised documentation.

The feature is still an *estimate*: NET and unspecified salaries are **not**
gross payroll costs; no tax conversion or pay-basis calculation is attempted.

## Verify after deployment

1. Hard-refresh `https://sita-82.github.io/HireOrGrow/` (Ctrl+Shift+R).
2. Footer should read `demo 0.9.10`.
3. With Armenia / DevOps / Mid and USD, market pay shows 3,300 per month,
   visibly labelled NET, indicative for Senior grade.
4. Georgia NET/GROSS unspecified; Slovakia GROSS/all grades; Portugal GROSS/Mid.
5. Monthly/Annual toggle works; manual rate still overrides and is marked
   pay basis not specified.

## Scope

No changes to live sources / collectors, talent candidate availability, or
visual redesign. These are planned in separate iterations.
