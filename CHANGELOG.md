## 0.9.0 — Consolidated decision comparison
- New Decision Comparison home with three mini-charts, each normalised within its own cost model and horizon; lowest estimated cost marked, not recommended.
- All three financial calculators available on the same page as expandable editors.
- Same alphabetical 43-role position selector in Decision Comparison and Market Intelligence; roles kept in sync.
- Benchmark remains a separate reference-only section, with 9 target markets and public source attribution.
- No changes to original math formulas or market data.

## 0.8.4 — Flat Position Dropdown

- Added 43 positions to **Market Intelligence → Position** in one alphabetically sorted dropdown, without groups.
- Covers bioinformatics, data science, algorithms, cloud/DevOps/support, data engineering, Java/JavaScript/mobile, HPC, QA/automation, Python/Go, BI and business analysis.
- Existing salary evidence retains exact-role matching only; uncovered roles display no verified reference.
- No changes to markets, USD/FX, salary providers or the three decision calculators.

# 0.8.3 — USD Salary Comparison

- Display salary benchmarks in USD by default using Frankfurter FX where available.
- Show original salary figures and original currency alongside each automatically converted amount.
- Display provider and FX quote observation date for every conversion, including in copied reports.
- Never invent USD conversions when FX quotes fail; retain original amount with an explicit warning.
- Preserve NET/GROSS labels, source links, market selection, and all financial calculators.
- Earlier v0.8.2 improvements: cleaner country cards and simplified market selection.

## 0.8.2 — salary card UI and cache consistency
- Simplified shortcuts to EU, US, Global and Clear. India remains available as a country checkbox.
- Responsive salary cards with clearly labeled fields and source/date.
- Versioned JS, CSS and JSON asset URLs to avoid stale mixed releases.
- Explicit loading-error state instead of incorrectly reporting no salary data.
- Kept country checkbox filtering and decision calculator logic unchanged.

## 0.8.2 · Country-card filter correction

- Fixed a UI bug: the Georgia advertised-salary panel used to remain visible when Georgia was deselected.
- Removed redundant country-specific source directory that displayed unselected locations.
- Country-specific warnings and copied reports now respect selected markets.
- Added browser regression tests for Armenia-only and zero-country selections.

# Change log

## 0.8 · 18 November 2026

- Split product navigation into **Market Intelligence** (reference information) and **Decision Calculators** (three independent scenario tools).
- Restricted country list to Armenia, Georgia, Kazakhstan, Portugal, Finland, Netherlands, Slovakia, United States and India.
- Presets: Priority 3 (AM/GE/SK), EU (PT/FI/NL/SK), US, India and Global (all nine).
- Compact salary evidence comparison table with source attribution, checked dates and grade/pay-basis caveats.
- Added source-backed Armenia Backend Engineer data to the reference dataset. No grade-based salary is manufactured for countries without coverage.
- Manual Internal rate remains separate from live data requests.
- Georgia source crawler is blocked by robots.txt; reports display source access failure rather than implying no vacancies.
- Preserved all existing decision calculations, report actions and CSV-free, no-storage demonstration mode.
