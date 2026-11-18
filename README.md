# HireOrGrow 0.9.2 — Decision Comparison

A public, static, English-language preview of HireOrGrow.

**Decision Comparison** shows three independent charts on one page: external vs internal hire (one-off cost), retain vs replace (full cost over its configured horizon), and hire vs promote vs reskill (incremental costs). Each chart has its own scale and highlights the lowest modeled amount, **not an HR recommendation**. Expand the corresponding editor to change assumptions. The selected position is shared with Salary Benchmarks.

**Salary Benchmarks** contains 43 alphabetized IT positions and nine countries. Salary numbers are dated, attributed public reference snapshots for a broader range of roles in all nine supported countries, not automatically refreshed live quotes. Source restrictions for Georgia are respected; the blocked vacancy widget is hidden until a working permitted feed is available. Currency conversion requires Frankfurter FX service and preserves the original salary and pay basis.

**Security:** no NDA-protected real rates, names or HR records; use fictional figures. All decision inputs are held in browser memory. The market tab fetches local public JSON and FX codes. Static GitHub Pages has no authentication, encryption of stored inputs, or corporate access controls.

### Update the site
1. Download the ROOT ZIP archive; extract it.
2. In GitHub repository root, choose Add file → Upload files.
3. Upload the **contents** of the extracted folder, with `index.html`, `app.js`, `market.js`, and `styles.css` at root, not inside another parent folder. Keep `data/`, `scripts/`, `tests/` and `.github/workflows/` paths as shipped.
4. Commit to `main` and review Actions. GitHub Pages remains configured to use GitHub Actions.
5. Visit the site and hard-reload; verify footer `v0.9.2`.

See TESTING.md and SECURITY.md.

### Interface notes (v0.9.2)
The Decision Comparison navigation explicitly names external vs. internal hire, retain vs. replace, and hire/promote/reskill. Charts are deliberately **unnumbered** and must be read independently: they cover different cost horizons and baselines. The *Scenario location* selector supplies report context only; changing it does not recalculate compensation, taxes or FX. Market reference data is presented in a separate **Salary Benchmarks** section.

## Salary evidence coverage (v0.9.2)
The public dataset has 110 attributed records across 9 countries. **These are dated snapshots, not live salary API results**. Grades, pay basis and sample sizes vary. A *candidate CTC* figure is not the same as employer gross base pay. Where the role or level is not matched the UI marks the record as context. Do not rank NET, gross, unspecified, and CTC as if comparable. Source websites retain their own terms and rights; investigate permission/licensing for any production/commercial redistribution.
