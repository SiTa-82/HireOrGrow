# HireOrGrow 0.9.11 — Decision Comparison + automated evidence

A public, static, English-language preview of HireOrGrow.

**Decision Comparison** shows three independent charts on one page: external vs internal hire (one-off cost), retain vs replace (full cost over its configured horizon), and hire vs promote vs reskill (incremental costs). Each chart has its own scale and highlights the lowest modeled amount, **not an HR recommendation**. Expand the corresponding editor to change assumptions. The selected position is shared with Salary Benchmarks.

**Salary Benchmarks** contains 43 alphabetized IT positions and nine countries. Salary numbers are dated, attributed public reference snapshots for a broader range of roles in all nine supported countries, not automatically refreshed live quotes. Source restrictions for Georgia are respected; the blocked vacancy widget is hidden until a working permitted feed is available. Currency conversion requires Frankfurter FX service and preserves the original salary and pay basis.

**Security:** no NDA-protected real rates, names or HR records; use fictional figures. All decision inputs are held in browser memory. The market tab fetches local public JSON and FX codes. Static GitHub Pages has no authentication, encryption of stored inputs, or corporate access controls.

### Update the site
1. Download the ROOT ZIP archive; extract it.
2. In GitHub repository root, choose Add file → Upload files.
3. Upload the **contents** of the extracted folder, with `index.html`, `app.js`, `market.js`, and `styles.css` at root, not inside another parent folder. Keep `data/`, `scripts/`, `tests/` and `.github/workflows/` paths as shipped.
4. Commit to `main` and review Actions. GitHub Pages remains configured to use GitHub Actions.
5. Visit the site and hard-reload; verify footer `v0.9.11`.

See TESTING.md and SECURITY.md.

### Interface notes (v0.9.2)
The Decision Comparison navigation explicitly names external vs. internal hire, retain vs. replace, and hire/promote/reskill. Charts are deliberately **unnumbered** and must be read independently: they cover different cost horizons and baselines. The *Scenario location* selector supplies report context only; changing it does not recalculate compensation, taxes or FX. Market reference data is presented in a separate **Salary Benchmarks** section.

## Salary evidence coverage (v0.9.9)
The public dataset has 110 attributed records across 9 countries. **These are preserved dated snapshots; separately, automated API snapshots are fetched weekly when available**. Grades, pay basis and sample sizes vary. A *candidate CTC* figure is not the same as employer gross base pay. Where the role or level is not matched the UI marks the record as context. Do not rank NET, gross, unspecified, and CTC as if comparable. Source websites retain their own terms and rights; investigate permission/licensing for any production/commercial redistribution.

## API-based updates (v0.9.9)

`market-data.yml` runs weekly and on commit, gathers permitted external API results into `data/automatic_market.json`, and deploys GitHub Pages. The 110 historical curated salary records remain intact in `data/salary_references.json`. SalaryByRole and YubHub data are labelled as API evidence, and individual job adverts are **not** used to infer salary medians. The API status and counts appear in the GitHub Actions job summary. A provider outage or zero relevant salary postings does not mean a country has no employment opportunities.

Navigation uses a scales icon for Decision Comparison and a money/coins icon for Salary Benchmarks. No third-party icon library is loaded.


## New in v0.9.9: Financial Assumptions and Rate Trends

On **Decision Comparison**, choose a position, seniority, and exact scenario
country. When Salary Benchmarks contains an exact-role salary reference with pay basis **GROSS**, **NET**, or **unspecified**, HireOrGrow now auto-fills the market input as reported. Matching-grade references take priority; if only a different/all-grade source exists it is labelled **Indicative · Level Mismatch**. A published median or transparently labelled range midpoint is used, with source, pay basis, grade, currency and period visible. No NET-to-GROSS conversion occurs. Broad job-family and CTC records remain context only. The default internal input mirrors the chosen market salary **as a proxy**, not verified employer cost.

Editable values:

- **Market Salary Rate** — original salary basis retained (NET, GROSS or not specified), sourced or manually entered.
- **Internal Salary Rate** — initially mirrors the market salary basis as a planning proxy; editable independently.
- **Promotion / Retention Raise (annual)** — 8.7% of internal pay (US Mercer
  2026 one-level promotion planning default, not local evidence).
- **Training Budget (one-off)** — 2026 US organizational mean $1,023 per learner,
  converted to the decision currency when an FX quote is available; not a
  specialty-specific reskilling price.
- **Employer Overhead % (optional)** — user assumption, 0 by default. The model
  NEVER calculates statutory local levies/taxes.

Editing the shared fields updates detailed calculators. Their salary-based
employer expense is an *illustrative proxy*, not payroll compliance.
The External vs Internal bar chart remains a one-time transition cost;
a separate 12-month salary-inclusive what-if shows the entered salary proxy and
states its simplifying assumptions.

The **Rate Trends** subsection of Salary Benchmarks displays a dated, source-
specific history saved in GitHub. See [RATE_HISTORY.md](RATE_HISTORY.md).
The static data library and the automatic API dataset are kept separate.

**No employee data belongs in GitHub Pages, the public repository, reports,
or examples. Only use fictitious manual figures.**

## New in v0.9.9 — pay periods and chart labels

Financial Assumptions has a **Monthly / Annual** selector for market salary,
internal salary and the promotion/retention raise. These values are canonicalized
internally to *annual amounts without changing their NET/GROSS basis*; switching the selector
never multiplies a value twice or changes the modeled results. Training remains a
**one-off** cost, and overhead remains a percentage.

A source published **per month** is annualized by multiplying by 12, and an
annual source can be displayed per month by dividing by 12. This never changes
NET into GROSS. NET and basis-unknown salaries populate the input as-is, but
the resulting employer-cost calculations are explicitly indicative, not verified
payroll cost. Currency conversion still depends on FX availability; without FX
the original figure is displayed as evidence but not inserted as the wrong currency.

Decision charts explicitly label figures as **One-Time Cost**, **N-Month Total Cost**
or **N-Month Incremental Cost**, with the exact period next to each displayed
amount. Values across separate charts must never be compared directly.


### Salary evidence in Decision Comparison (0.9.10)

**Role & Level Match** auto-fills a source salary with NET, GROSS, or unspecified
basis when country, role and grade match. **Indicative · Level Mismatch**
also auto-fills an exact-role record that covers another grade or all levels,
without making any synthetic grade adjustment. Its limitation is prominent.
Source amount, pay basis, currency, period, date, range/median method and URL
are preserved. **Context Only** is used for CTC and broader occupation families;
these do not become salary quotes. With no appropriate salary or FX, the rate
remains blank. A scenario-specific **Manual Estimate** always takes precedence
until the scenario changes or the user resets defaults. Manual basis is marked
**NOT SPECIFIED**, not falsely assumed GROSS.

Calculators continue to run as planning simulations, but NET/unknown basis
(including when internal salary inherits a source) is **not** a validated
all-in employer cost. No tax, pay basis conversion, or legal entitlement is
calculated. The product is not an HR recommendation system.

### v0.9.9: Calculator guidance

The **Read the charts independently** notice is displayed inside **Decision Calculators**, immediately before the comparison charts rather than before Financial Assumptions. Context-only salary evidence explains requested vs. published seniority grades.

## Core decision logic v0.9.11

Candidate availability, readiness periods, and optional monthly business impact are described in [CORE_PATCH_README.md](CORE_PATCH_README.md). These inputs explicitly distinguish an unavailable/unassessed internal option from a cheap option. The frontend styling and UX-01 patch remain separate.
