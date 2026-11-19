## v0.9.10 — NET/GROSS rates as reported · 19 November 2026

- Financial Assumptions no longer rejects NET or unspecified-pay-basis salary evidence. Source salary amount is auto-filled in the selected currency when FX is available, keeping the original pay basis, grade, period, date, source and midpoint/median method visible.
- When the exact occupation has only other-grade or all-grade evidence, the value also auto-fills with an **Indicative · Level Mismatch** warning; no junior/senior multiplier is invented.
- Broader job-family estimates and CTC remain context only. Unknown FX never inserts one currency as another.
- Market and default internal salary inputs display their pay basis; manual values are marked **basis not specified**. NET is never converted to GROSS. Financial calculator outputs remain directional proxies with a visible limitation.
- Monthly/Annual rate switch remains reversible. Added regression tests for NET, GROSS, unknown pay basis, manual overrides, grade differences and absent FX.
- No new pay sources, employee-readiness logic or full UX redesign in this patch; those remain separate tracks.

# HireOrGrow v0.9.9 — Calculator Guidance Placement

- Moved **Read the charts independently** guidance from above Financial Assumptions to directly above the three Decision Calculators.
- Clearly distinguishes one-time transition expenses, total cost, and incremental cost; the three scales are not comparable.
- Clarified Junior / Senior context-only evidence messages: shows requested level and source coverage without inferring a different grade.
- All existing formulas and datasets retained.

## v0.9.8 — Pay rate periods & chart horizons
- Monthly / Annual display switch for market and internal gross pay and promotion raise. Source records in monthly gross format are annualized ×12; annual ones shown monthly ÷12.
- Canonical annual values prevent conversion drift and preserve unchanged financial outputs when toggling.
- Per-scenario chart figures explicitly labelled as one-time cost, N-month total or N-month incremental.
- Gross/net/CTC limitations unchanged; no private data sent to APIs.

## v0.9.5 — Aligned decision chart tracks (UI fix)
- Standardized the vertical positions of scenario labels, lead-time details, colored bars, and lowest-cost tags across all three decision cards.
- Reserved blank lead-time lines for scenarios without readiness times and invisible third slots for two-option comparisons.
- Preserved all calculator formulas, market datasets, integrations and current workflows.
- No API keys or confidential data included.

## v0.9.4 — Decision Comparison visual alignment

- Styled decision cards with a subtle blue accent to match the Decision Comparison navigation.
- Aligned headings, bars, conclusions and edit controls across the three cards.
- Changed card headings and subtitles to Title Case, standardized month markers (days ÷ 30.44, approximate), and made the Edit Assumptions buttons prominent and keyboard accessible.
- Preserved financial calculation formulas, Salary Benchmarks data and external source workflows.

## v0.9.3 — Open-source salary snapshots and clearer navigation

- New scheduled public-API salary snapshots appear **in addition to** the 110 existing sourced salary references, which are not overwritten.
- Added separate salary-posted job listings with source, date, and no invented gross/net conversions.
- Highlighted the two top-level buttons with scale and coin icons, contrasting colors, and a visible active-state outline.
- Updated GitHub Actions to run the public-source refresh weekly, while retaining prior data on permitted-provider outages.
- Kept Internal rate manual and isolated from API requests.

**Availability note:** Provider success and geographic coverage are not guaranteed. A successful GitHub Pages deployment does not prove a successful provider refresh; inspect the job summary.

## v0.9.2 · Expanded salary evidence
- Increased dated salary references from 7 to 110 across all 9 supported countries.
- Matched mid-level bands where source data permits; all-grade surveys and candidate CTC stay explicitly differentiated.
- Preserved original source URL, currency, period, gross/net/CTC/unknown basis, sample when published, checked date.
- Still no automatic commercial API or permission to scrape protected sources; source data are curated snapshots.
- No changes to decision calculators or internal rate privacy model.

## 0.9.1 — UI clarity and unnumbered comparisons
- Rename Market Intelligence to Salary Benchmarks throughout visible UI.
- Clarify the Scenario location selector: report context only; no automatic salary, tax or currency changes.
- Identify the three specific financial comparisons under Decision Comparison.
- Move the “Read the charts independently” explanation above charts and inputs.
- Remove decorative 01 / 02 / 03 numbering from the three comparison cards.
- Do not change the financial model, available roles, salary-source integration, or external network permissions.

## 0.9.1 — Consolidated decision comparison
- New Decision Comparison home with three mini-charts, each normalised within its own cost model and horizon; lowest estimated cost marked, not recommended.
- All three financial calculators available on the same page as expandable editors.
- Same alphabetical 43-role position selector in Decision Comparison and Salary Benchmarks; roles kept in sync.
- Benchmark remains a separate reference-only section, with 9 target markets and public source attribution.
- No changes to original math formulas or market data.

## 0.8.4 — Flat Position Dropdown

- Added 43 positions to **Salary Benchmarks → Position** in one alphabetically sorted dropdown, without groups.
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

- Split product navigation into **Salary Benchmarks** (reference information) and **Decision Calculators** (three independent scenario tools).
- Restricted country list to Armenia, Georgia, Kazakhstan, Portugal, Finland, Netherlands, Slovakia, United States and India.
- Presets: Priority 3 (AM/GE/SK), EU (PT/FI/NL/SK), US, India and Global (all nine).
- Compact salary evidence comparison table with source attribution, checked dates and grade/pay-basis caveats.
- Added source-backed Armenia Backend Engineer data to the reference dataset. No grade-based salary is manufactured for countries without coverage.
- Manual Internal rate remains separate from live data requests.
- Georgia source crawler is blocked by robots.txt; reports display source access failure rather than implying no vacancies.
- Preserved all existing decision calculations, report actions and CSV-free, no-storage demonstration mode.

## v0.9.6 — Financial Assumptions + Rate Trends

- Added a shared, editable financial assumptions panel covering role/level-specific market gross pay, internal gross pay, annual promotion/retention increase, and one-off training budget. Optional employer overhead remains explicitly user-provided.
- Market pay is populated only for a same-role, same-seniority, GROSS benchmark; report a sourced median or a labelled range midpoint, not a fake market average. When no comparable source exists, do not invent a salary.
- Promotion default is 8.7% (Mercer 2026 US compensation planning, one-level promotions), and training default is $1,023/learner (Training Magazine 2026 US organizational average); neither figure claims to be local or occupation-specific.
- Shared assumptions feed the three financial models; the one-off cost chart stays one-off, with a separate illustrative first-year pay comparison. Financial models use gross salary plus manually assumed overhead as an employer-cost proxy, not an automatic local tax calculation.
- Added a distinct **Rate Trends** section, displaying observations separately by occupation, market, seniority, original currency, gross/net basis, and source. Historical values are never backdated or combined across unlike datasets.
- Added an append-only public `data/rate_history.json` snapshot and a GitHub Action that saves future source observations back into the repository before publishing. Static studies create a new point only if their published values change. API records are archived only when freshly fetched, not when re-used from an earlier API failure.
- Unchanged formula structure and all 110 prior salary benchmark records retained.


### 0.9.8 — Explicit salary-evidence matching
- Three evidence statuses in Decision Comparison: Verified Match (same country, job, grade and gross basis), Indicative Estimate (same job, different/all grades, gross basis), and Manual Estimate / Context Only.
- Indicative evidence is not used automatically; the user must click **Use This Indicative Gross Rate**. Approval is invalidated when country, grade, job, currency or source changes.
- Net, CTC, unspecified pay basis and broader job families never populate employer gross costs automatically.
- Source links, reported amounts, pay periods and FX notes shown with assumptions. Calculators and salary library are unchanged.

In each matching state, an explicit explanation and **Enter a More Accurate Gross Rate Manually** action identifies the source, grade coverage, pay basis, period and source/date when available. User input overrides the estimate for the selected country/role/grade/currency; switching scenarios clears a manual market quote rather than silently reusing it.
