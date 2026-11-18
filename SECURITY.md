# TalentCost 0.5 — Security status: public proof of concept, NOT NDA-approved

## What leaves the page

The live Market tab makes only the following keyless HTTPS GET queries:

- `https://salarybyrole.com/api/salary?role=...&country=...` — selected **public** role and country only.
- `https://jobicy.com/api/jobs?count=100&tag=...` — public role title only.
- `https://api.frankfurter.dev/v2/rates?base=usd` — fixed FX lookup.

No `Internal rate` value is included in request URLs, bodies, or custom headers. No telemetry SDK or localStorage. Client `fetch()` is configured with `credentials: 'omit'` and `referrerPolicy: 'no-referrer'` (browsers may still transmit connection metadata such as IP and Origin). Salary response cache is limited to current-tab memory. This is based on the demo source code and mocked request tests, not a production security audit.

## Browser controls

- Content Security Policy restricts `connect-src` to SalaryByRole, Jobicy and Frankfurter; `script-src 'self'`; `style-src 'self'` and `default-src 'none'`. No third-party JavaScript packages.
- Untrusted API fields are HTML-escaped, and remote listing links are restricted to HTTPS links on Jobicy. Source APIs are hardcoded allowlisted URLs.
- Providers may have downtime, throttling, CORS changes, inconsistent data, or terms of use updates.
- Copy, print and PDF can expose manual figures to the clipboard, local disk, browser extensions, printer, and document-sharing software.

## Do not use for protected employee information

**NEVER put personal compensation, identifiable employee records, internal billing rates, confidential payroll, corporate customer data, NDA-protected exports, tokens or credentials into a public GitHub Pages demo.** No login/RBAC, centralized audit, encryption at rest, retention control, enterprise DLP or organizational approval exists here. In-memory only is not equivalent to secure handling of confidential information.

A corporate implementation would need separate public-market collector, access controls (SSO/MFA and least privilege), approved data-processing agreements, permissions by team, encryption, output policy, audit logging, security review and governance. Keep external public source queries separated from internal data by design.
