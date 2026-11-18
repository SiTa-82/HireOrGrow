# Security and privacy — HireOrGrow 0.8

This GitHub Pages application is an experimental PUBLIC browser demo. Do not use it with NDA-protected rates, individual employee compensation, personal data, real internal HR plans, or company rate cards. It has not undergone independent security assessment or penetration testing.

## Data flow

- Browser: HTTPS GET to **same-origin** `data/salary_references.json` (manually reviewed, public) and `data/georgia_live.json` (public, generated in GitHub Actions).
- Optional browser FX: GET to `https://api.frankfurter.dev/v2/rates?base=USD`, transmitting currency codes and network metadata only.
- GitHub Actions deploys the public snapshots. The Georgia source denied automated crawler access through robots.txt. Scheduled collection is **disabled** until a permitted API or written authorization is available. No internal rate information is sent to the workflow.
- Manual `Internal rate` is stored in the page's JavaScript memory for the current tab. It is not sent in these requests or persisted in localStorage, cookies or a database.
- Copy/Print intentionally export any manually entered amount. Browser extensions, compromised devices and other users of the device may also observe it.

## Protection and limitations

- A Content Security Policy restricts network connections to the same origin and Frankfurter, with no third-party scripts.
- URL allowlists and HTML escaping are used for rendered provider data.
- `Internal rate` is neither uploaded nor included in market provider requests.
- GitHub source and deployed Pages are public, so do not add secrets to the repository, source datasets or GitHub Actions logs.
- This does not include SSO, audit logging, encrypted corporate storage, permissions, DLP, or legal approvals necessary for processing real employee data.
- Source content might be incorrect, stale, incomplete, imprecise, or legally restricted for broader reuse. Only one small curated subset is included; ask providers for proper API licenses before expansion.

## Responsible use

Salary benchmarking is a decision-support input only. A geographic or grade-mismatched range must not be presented as a like-for-like salary estimate. National taxes, payroll burden, employment law and termination decisions are outside the current demo; use local experts before taking action.


## v0.9.6 Public rate history

`data/rate_history.json` contains only publicly attributable observations from
market sources. It must NEVER contain manual internal rate input, employee
identifiers, offer details, client billing rates, or NDA-protected information.
The weekly GitHub workflow commits this public file to the repository with
`contents: write`. Source ingestion stays server-side; the browser fetches
published static JSON and public Frankfurter FX. Production corporate use
still requires authenticated hosting and independent security assessment.
