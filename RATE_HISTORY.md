# Rate Trends: recording history safely

## What gets saved

`data/rate_history.json` is **public, source-attributed market information only**.
Each observation stores the observed date, original numeric values, source URL,
country, role, grade, original currency, pay period and gross/net/unknown basis.
**No employee salaries, manual Internal rate values, account data or personal data** are archived.

The bundled first point (2026-11-18) archives **existing published reference data**.
It is *not* evidence that every provider published an update on that date.

## How automatic persistence works

1. GitHub Actions runs every Tuesday (also on manual run and repository push).
2. `scripts/update_open_sources.py` queries permitted free APIs and produces
   `data/automatic_market.json`. These APIs may fail or return zero records.
3. `scripts/update_rate_history.py` loads the pre-existing history file and
   appends only attributable, source-specific records:
   - For dated salary surveys, one baseline record and additional observations
     only when underlying source values or publication date **actually change**.
   - For a refreshed numeric salary API, one observation per successful
     collection date; previously retained values are NOT appended as new.
   - Employer job-ad salaries are stored as separate salary-posted vacancy
     evidence, not mixed into the numeric survey trend.
4. The workflow commits `data/rate_history.json` and
   `data/automatic_market.json` back to the **main branch** using `GITHUB_TOKEN`
   with `contents: write`, then deploys GitHub Pages from the same run.
5. On the Salary Benchmarks tab, **Rate Trends** shows source-by-source
   nominal changes only after multiple saved observations.

The workflow's own `GITHUB_TOKEN` commits do NOT trigger another workflow run.
This prevents endless deployment loops. If branch protection or organization
policy blocks the commit, the job should fail visibly. Allow GitHub Actions to
write content under repository settings, or adjust protected-branch policy via
an authorized administrator. Never upload company salary data to this public repo.

## How to interpret the graph

- One dot means monitoring has started; no historic change can be calculated.
- A flat line across two API polls means the *provider returned the same
  number*, not proof that the labor market was unchanged.
- Changing source, grade, pay basis or currency creates a **different series**.
- USD-converted values are not used to chart historical pay movement, because
  foreign-exchange fluctuations could masquerade as salary changes. Charts use
  original source currency, nominal units, and show survey publication date.
- Static salary reports do not update weekly. The collector cannot guarantee
  coverage for Armenia, Georgia and Slovakia without approved APIs/licensing.

## Commands for testing

```bash
python tests/test_rate_history.py
python scripts/update_rate_history.py
python tests/test_browser.py
```

The script is deterministic for provided `--date` and stores records in JSON.
For production, do not manually change the observation dates.
