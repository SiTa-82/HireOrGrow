# HireOrGrow v0.8.1 — Market Intelligence + Decision Calculators

**Site:** https://sita-82.github.io/HireOrGrow/  
**GitHub:** https://github.com/SiTa-82/HireOrGrow

## Two distinct product areas

- **Market Intelligence (reference-only).** Public, sourced salary snapshots shown by role, level and location; pay basis, sample size, update/check dates and source links. This does not decide whether to hire or promote.
- **Decision Calculators.** Three independent financial tools: **External vs. internal hire**, **Retain vs. replace**, and **Promote vs. reskill**. Figures are entered manually; no salary report is silently injected into financial decisions.

## Location scope

Only **nine countries**: Armenia, Georgia, Slovakia, Kazakhstan, Portugal, Finland, Netherlands, United States and India. Presets:

| Preset | Selection |
|---|---|
| Priority 3 | Armenia, Georgia, Slovakia |
| EU | Portugal, Finland, Netherlands, Slovakia |
| US | United States |
| India | India |
| Global | All nine countries |
| Custom / Clear | Manual country choices / none |

EU is a selection of the four supported EU states, **not a Europe-wide average**. Global selects locations, **not a global salary average**.

## Salary data: coverage is limited

The **included, dated references** cover selected roles in Armenia (ITA Jobs), Georgia (Fairpay) and Slovakia (Platy.sk); they are not guaranteed to match a requested grade. Other selected markets display **No documented range** until a suitable, licensed source is connected. No salary number is inferred or invented. The Georgia job-vacancy collector currently cannot retrieve permitted data because the provider's robots.txt denies our crawler. No bypass is attempted. Historical source snapshots can be displayed despite failed collection.

The only network calls made by the browser are same-origin JSON resources and the external Frankfurter FX service (currency codes only). `Internal rate` is stored in page memory; do not enter confidential or NDA-protected figures into this public demo. There is no authentication or corporate security certification.

## GitHub installation

1. Download and unzip the project. Upload **files and folders** to the root of `SiTa-82/HireOrGrow`, replacing previous versions; preserve `.github/workflows`, `data`, `scripts` and `tests`.
2. In Settings → Pages select **GitHub Actions**. This project includes a deploy workflow at `.github/workflows/market-data.yml`.
3. Check Actions for the publish job. A successful deployment does **not** imply a successful live salary collection; check the job summary for the data status.
4. Verify the site with demo inputs. For local checks, run `python -m http.server 8000` in the project folder and open `http://localhost:8000`.

No API keys or user data are required. See `SECURITY.md`, `TESTING.md` and `CHANGELOG.md`.

## Country selection visibility

All source details and country-specific vacancy panels are filtered by selected market checkboxes. For example, Armenia alone shows no Georgia vacancy card.
