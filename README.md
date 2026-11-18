# HireOrGrow 0.9.6 — Decision Comparison + automated evidence
HireOrGrow is a lightweight HR analytics tool that helps Talent Acquisition, HR, and business leaders make data-driven workforce decisions.

Key Features:

Salary Benchmarks: Compare market salaries across 9 countries and 43 IT roles, with transparent sources and currency conversion.

Decision Comparison: Evaluate the financial impact of external hiring, internal transfers, employee retention, promotion, and reskilling.

Financial Assumptions: Model workforce costs using market salary benchmarks, manually adjustable internal rates, salary increases, training budgets, and employer overhead.

Rate Trends: Track historical salary changes through automatically archived market observations and visual trend analysis.

Automated Data Updates: Scheduled integration with public salary and job-market APIs, while preserving existing historical benchmarks.

The platform combines market intelligence with interactive financial scenarios to help companies understand talent costs, compare alternatives, and make better-informed workforce decisions.

Current status: Public demo / MVP. Automated data coverage varies by market, and the platform is not yet approved for confidential employee data.
A public, static, English-language preview of HireOrGrow.

**Decision Comparison** shows three independent charts on one page: external vs internal hire (one-off cost), retain vs replace (full cost over its configured horizon), and hire vs promote vs reskill (incremental costs). Each chart has its own scale and highlights the lowest modeled amount, **not an HR recommendation**. Expand the corresponding editor to change assumptions. The selected position is shared with Salary Benchmarks.

**Salary Benchmarks** contains 43 alphabetized IT positions and nine countries. Salary numbers are dated, attributed public reference snapshots for a broader range of roles in all nine supported countries, not automatically refreshed live quotes. Source restrictions for Georgia are respected; the blocked vacancy widget is hidden until a working permitted feed is available. Currency conversion requires Frankfurter FX service and preserves the original salary and pay basis.

**Security:** no NDA-protected real rates, names or HR records; use fictional figures. All decision inputs are held in browser memory. The market tab fetches local public JSON and FX codes. Static GitHub Pages has no authentication, encryption of stored inputs, or corporate access controls.

### Update the site
1. Download the ROOT ZIP archive; extract it.
2. In GitHub repository root, choose Add file → Upload files.
3. Upload the **contents** of the extracted folder, with `index.html`, `app.js`, `market.js`, and `styles.css` at root, not inside another parent folder. Keep `data/`, `scripts/`, `tests/` and `.github/workflows/` paths as shipped.
4. Commit to `main` and review Actions. GitHub Pages remains configured to use GitHub Actions.
5. Visit the site and hard-reload; verify footer `v0.9.6`.

See TESTING.md and SECURITY.md.

### Interface notes (v0.9.2)
The Decision Comparison navigation explicitly names external vs. internal hire, retain vs. replace, and hire/promote/reskill. Charts are deliberately **unnumbered** and must be read independently: they cover different cost horizons and baselines. The *Scenario location* selector supplies report context only; changing it does not recalculate compensation, taxes or FX. Market reference data is presented in a separate **Salary Benchmarks** section.

## Salary evidence coverage (v0.9.6)
The public dataset has 110 attributed records across 9 countries. **These are preserved dated snapshots; separately, automated API snapshots are fetched weekly when available**. Grades, pay basis and sample sizes vary. A *candidate CTC* figure is not the same as employer gross base pay. Where the role or level is not matched the UI marks the record as context. Do not rank NET, gross, unspecified, and CTC as if comparable. Source websites retain their own terms and rights; investigate permission/licensing for any production/commercial redistribution.

## API-based updates (v0.9.6)

`market-data.yml` runs weekly and on commit, gathers permitted external API results into `data/automatic_market.json`, and deploys GitHub Pages. The 110 historical curated salary records remain intact in `data/salary_references.json`. SalaryByRole and YubHub data are labelled as API evidence, and individual job adverts are **not** used to infer salary medians. The API status and counts appear in the GitHub Actions job summary. A provider outage or zero relevant salary postings does not mean a country has no employment opportunities.

Navigation uses a scales icon for Decision Comparison and a money/coins icon for Salary Benchmarks. No third-party icon library is loaded.


## New in v0.9.6: Financial Assumptions and Rate Trends

On **Decision Comparison**, choose a position, seniority, and exact scenario
country. When Salary Benchmarks contains a same-role, same-grade **gross** pay
reference, HireOrGrow uses a reported median or the transparent midpoint of a
published range as the initial annual market pay. Otherwise, the field remains
empty and clearly requires manual verification. Internal pay defaults to the
market pay only when comparable evidence is available; otherwise it is a
**demo number, not a local average**.

Editable values:

- **Market Annual Gross Rate** — verified role, country, grade if possible, or manual entry.
- **Internal Annual Gross Rate** — initially aligned with that rate when available.
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
a separate 12-month salary-inclusive what-if shows the gross proxy and
states its simplifying assumptions.

The **Rate Trends** subsection of Salary Benchmarks displays a dated, source-
specific history saved in GitHub. See [RATE_HISTORY.md](RATE_HISTORY.md).
The static data library and the automatic API dataset are kept separate.

**No employee data belongs in GitHub Pages, the public repository, reports,
or examples. Only use fictitious manual figures.**
