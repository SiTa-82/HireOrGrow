# HireOrGrow 0.9.0 — Decision Comparison

A public, static, English-language preview of HireOrGrow.

**Decision Comparison** shows three independent charts on one page: external vs internal hire (one-off cost), retain vs replace (full cost over its configured horizon), and hire vs promote vs reskill (incremental costs). Each chart has its own scale and highlights the lowest modeled amount, **not an HR recommendation**. Expand the corresponding editor to change assumptions. The selected position is shared with Market Intelligence.

**Market Intelligence** contains 43 alphabetized IT positions and nine countries. Salary numbers are dated, attributed public reference snapshots for limited roles in Armenia, Georgia, and Slovakia, not automatically refreshed live quotes. Source restrictions for Georgia are respected. Currency conversion requires Frankfurter FX service and preserves the original salary and pay basis.

**Security:** no NDA-protected real rates, names or HR records; use fictional figures. All decision inputs are held in browser memory. The market tab fetches local public JSON and FX codes. Static GitHub Pages has no authentication, encryption of stored inputs, or corporate access controls.

### Update the site
1. Download the ROOT ZIP archive; extract it.
2. In GitHub repository root, choose Add file → Upload files.
3. Upload the **contents** of the extracted folder, with `index.html`, `app.js`, `market.js`, and `styles.css` at root, not inside another parent folder. Keep `data/`, `scripts/`, `tests/` and `.github/workflows/` paths as shipped.
4. Commit to `main` and review Actions. GitHub Pages remains configured to use GitHub Actions.
5. Visit the site and hard-reload; verify footer `v0.9.0`.

See TESTING.md and SECURITY.md.
