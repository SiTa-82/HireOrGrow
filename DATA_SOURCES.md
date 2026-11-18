# Salary evidence — sources and limitations

As of 18 November 2026, v0.9.2 bundles **110 attributed reference entries**, covering **104 distinct occupation/country pairs** across **9 countries**. These are **manually curated, dated snapshots** — NOT 110 live API integrations or 110 independently verified salaries.

**Armenia** — [ITA Jobs](https://jobs.ita.am/ru/zarplaty), community/salaries.am-based net-pay survey. Certain occupations are pooled across a family, which is clearly labelled.

**Georgia** — [Fairpay.ge](https://www.fairpay.ge/positions), anonymous self-reported monthly GEL. Typically small samples; gross/net is unspecified. The previous automated findjobs.ge feed remains inaccessible to this crawler under robots.txt; do not bypass it.

**Slovakia** — [Platy.sk](https://www.platy.sk/en/salaryinfo/information-technology?global_currency=EUR), survey gross monthly ranges for all levels, not per-grade. Publication dates are not supplied on referenced pages. A commercial API exists separately.

**Kazakhstan** — [Taylor.kz](https://taylor.kz/salaries), advertised pay by technology for vacancies in Kazakhstan, 90-day reference window. Technology is not a narrowly defined job title. The additional [Kazinform article](https://www.inform.kz/ru/kakie-zarplati-predlagayut-spetsialistam-poii-analitike-ikiberbezopasnosti-vkaza-57a35a5f) provides October 2026 Data Engineer vacancy ranges.

**Portugal and Netherlands** — [iTechScope Salary Report 2026](https://www.itechscope.com/it-salary-market-report-2026/europe-benchmarks.html), compiled recruiter mid-level (3–5 years) annual gross range; estimate, not a job offer.

**Finland** — [Pearson Carter 2026](https://www.pearsoncarter.com/hiring-guides/cloud-devops-security-2026), lower/medium/upper guide for monthly gross base; not grouped by years of experience.

**United States** — [Realtime Recruitment USA Salary Guide 2026](https://realtime.jobs/wp-content/uploads/2025/12/Realtime-Recruitment-Salary-Guide-USA-2026.pdf), 3–5 years annual base salary bands. Salary-guide data are indicative.

**India** — [HyrEzy Tech Salaries 2026](https://hyrezy.com/reports/tech-salaries-by-role-india-2026/), 3–5 years self-reported candidate CTC percentiles. CTC is not gross base; DevOps/SRE and QA/SDET are grouped.

### Important
- The application compares salary *evidence*, not total employer costs. Salary basis varies by provider; currency conversion does **not** make net, gross, and CTC equivalent.
- Never label source snapshots as live. FX exchange rates are retrieved separately and timestamped if available.
- Some sources have restrictive licensing. Before any **commercial distribution** or production integration, review relevant terms and obtain licensed data/API access where required. No unauthorized scraping or bypass of access restrictions is included.
- The user-entered Internal rate remains a client-side, manual demo input; never enter real NDA-covered payroll in public GitHub Pages.
