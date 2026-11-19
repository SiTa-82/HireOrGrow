# HireOrGrow v0.9.11 — Core / Decision Logic patch

**This is a functional patch, not the UX redesign.** The `styles.css`, market data, source collectors, and GitHub Actions workflow are unchanged. Existing arrow icons in Edit Assumptions buttons are unchanged so UX-01 can be shipped or rolled back independently.

## What changed

- Added two independent candidate selectors in Financial Assumptions: **Candidate for promotion?** and **Candidate for reskilling?** (Yes / No / Not assessed). Both default to **Not assessed**, not implicitly Yes.
- If no candidate is identified, the relevant internal route is shown as **No suitable candidate** or **Candidate not assessed**, with no numeric total in its result card; it is excluded from the cost ranking. When only one assessed feasible route remains, the UI says that explicitly rather than claiming a cost advantage.
- The pre-existing **Possible Salary Increase / Month or Year** and **Possible Training Budget / One-Off** inputs remain editable and feed the detailed financial calculators. Salary increments are annualized; training is never multiplied by twelve. This is a planning assumption, not a promise or automatic salary proposal. The single top-level input currently serves as an initial shared estimate for retention/promotion/reskilling; detailed cost editors retain their separate fields.
- Added quick inputs for **Promotion · months to transition** and **Reskilling · months until ready**. These synchronize with detailed calculator values. Advanced fields allow adding the time from external start/promotion transition until **full productivity**; their initial value is 0, not a purported market average.
- Added optional **Business impact per month until productive**, in the selected currency. When entered, it replaces overlapping target-role vacancy/ramp-up losses **inside the Hire/Promote/Reskill model only**, calculated as `monthly impact × months until full productivity`, capped at the selected scenario horizon. Losses in the previous role and training-related losses remain separately modeled, so review for overlap. Other existing calculators retain their own loss inputs.
- A candidate who would not reach full productivity **within** the selected horizon is **not ranked as a cheaper feasible option**; the report explains why.
- CEO/decision summaries and copyable reports include candidate status, time to full productivity, and the time-impact method or missing-time-cost caveat.

## What did NOT change

- No NET/GROSS conversion; v0.9.10 salary behavior remains.
- No changes to `styles.css` or removal of arrows. UX changes remain in separate `UX-01` patch.
- No alteration to CI hotfix or market data collectors.
- No employee personal data, names or private HR records are sent to sources.
- The Retain vs Replace financial model was **not** rewritten; it still uses its independent vacancy and ramp loss inputs. The shared monthly time-impact estimate applies to **Hire / Promote / Reskill** only.

## Install

**Quick update (recommended)**: unpack `HireOrGrow_v0_9_11_CORE_QUICK_UPDATE.zip`, then upload its *contents* into the root of the GitHub repository, preserving `tests/`; commit as a separate **Core / v0.9.11** change. It changes only `index.html`, `app.js`, documentation, and tests. Keep your current `.github/workflows`, `data/`, `market.js`, and `styles.css`.

**Full root**: use only if you need an entire v0.9.11 project based on the v0.9.10 CI-fixed archive used for this build. This may overwrite other edits made in GitHub since that archive was supplied.

Reload GitHub Pages with Ctrl+Shift+R and look for **v0.9.11**. Check that both internal paths start in **Not assessed** status and that adjusting either candidate selector updates the decision cards.

## Rollback

If this patch was its own GitHub commit, use **Revert** on that specific commit. Do not roll back the independent NET/GROSS or GitHub Actions fixes.

## Validation

- `node --check app.js`
- `python tests/test_browser.py`
- `python tests/test_candidate_feasibility.py`
- `python tests/test_source_pipeline.py`
- `python tests/test_auto_sources.py`
- `python tests/test_rate_history.py`
- `python tests/test_salary_evidence.py`

These are local tests. They do not confirm GitHub Pages deployment or real-world salary source availability.
