## 0.8.1 · Country-card filter correction

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
