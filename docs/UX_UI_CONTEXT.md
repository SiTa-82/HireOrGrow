# HireOrGrow — UX/UI Context & Decisions

**Status:** implemented as a Blue Lagoon UI patch in the v0.9.11 source archive; pending user review and GitHub deployment  
**Last updated:** 2026-11-19  
**Purpose:** a durable source of truth for resuming UI work without reconstructing past chats.  
**Recommended repository path:** `docs/UX_UI_CONTEXT.md`

> Scope of this file: agreed design direction, interface requirements, implementation boundaries, and open questions. It is **not** evidence that the corresponding code exists. Verify actual product behavior and formulas in the repository before implementation.

## 1. Decisions already made (approved)

| Topic | Decision |
| --- | --- |
| Overall layout | **Concept B — Decision-first Dashboard** |
| Navigation/education | Add a dedicated **Methodology & Guide** section, inspired by Concept C — Analyst Workspace |
| Color palette | **Blue Lagoon** |
| Project strategy | Originally planned to finish the business logic first; on 19 November 2026 the user provided the latest v0.9.11 archive and explicitly requested application of the design to this version. Future logic improvements remain a separate track. |
| Delivery | After integration and testing, commit/push the changes to the **existing Git/GitHub repository** |
| Change safety | Keep UI and business-logic changes distinguishable; preserve an easy rollback path |
| Documentation | No separate formal design guide/handoff is needed as a deliverable. This file exists only to preserve project context |

## 2. Product UX goal

Help HR/business users compare staffing decisions with clear costs, time horizons, assumptions, and evidence. Prioritize **the decision and its explanation** over exposing every input at once. The application should feel modern, professional, friendly, and analytically credible rather than crowded or visually heavy.

## 3. Blue Lagoon color direction

Selected palette from the agreed prototypes:

- **Deep blue:** `#0C4255` — stronger navigation, titles or structural elements
- **Ocean blue:** `#14849B` — primary actions, active states, important highlights
- **Teal:** `#169E8E` — secondary accents, focus, selected/highlight states where semantically appropriate
- **Light aqua surfaces:** for information panels/methodology panels; precise tokens not finalized
- **Neutral light background:** for clarity and restraint; precise tokens not finalized

**Design rule:** Blue/teal are for orientation and interaction. Do not rely on color alone to convey a recommendation or good/bad result. Success, warning and error meaning should be conveyed with labels/icons as well. Verify accessibility contrast during implementation.

These hex values were used as concept palette anchors, **not** a complete final design-token specification. Exact component shades and contrast may be refined against real screens.

## 4. Main screen — Concept B (Decision-first)

- Make **Decision Comparison** the main focal point.
- Show comparison outcome, cost/time impact and explanatory evidence before optional details.
- Keep calculators and their business logic distinct; **do not invent a single universal score** mixing non-comparable scenarios.
- Present **Financial Assumptions** as a clear, editable area that can stay visually compact until needed; expose an obvious **Edit Assumptions** action.
- Minimize unnecessary arrows, numbering, overly dense forms and repeated explanations.
- Maintain consistent typographic hierarchy, alignment, spacing, buttons, tabs, charts and states.
- Use consistent **Title Case** in English interface labels.
- Make the time period explicit next to every amount (monthly vs annual etc.).

### Comparison contexts known from prior conversations

1. **External vs. Internal Hire**
2. **Retain vs. Replace**
3. **Hire, Promote or Reskill**

These can have different calculation bases and time horizons. Preserve accurate labels, sources, assumptions and comparability; do not conflate financial costs and periods.

## 5. Data visualization and information clarity

- On charts, make scales, labels and what is being compared unambiguous. Use independent scales where necessary to prevent misleading comparisons.
- Where a green lower-cost cue is used, it should indicate **the lowest calculated cost in that relevant comparison**, not automatically the best overall strategic decision.
- Explain **market salary/rate data**: source, geography, role, period, currency and NET/GROSS/Not specified where applicable.
- Support monthly/yearly presentation and unit conversion in the interface (actual conversion logic stays in the functional track).
- Distinguish **market average** from **internal rate entered by the user**. If internal rate is prefilled from market average, this must be visible and editable.
- When an automatic benchmark is missing, approximate or does not match the target role precisely, show a human-readable explanation and an option to supply an exact value manually.
- Include a way to view **rate dynamics/history**; its data storage and collection belong to the logic/data track.
- Explain what **Scenario Location** means and which figures are affected by it.
- If no suitable internal candidate exists for promotion or reskilling, show a clear unavailable/not-applicable state rather than an unexplained blank or misleading zero.

## 6. Methodology & Guide — dedicated section

Borrow the strong **methodology** concept from Concept C without adopting its more crowded analyst-workspace layout.

Content areas to include:

1. **Getting started:** how to work through a decision in HireOrGrow.
2. **Understanding each calculator:** what each comparison answers and when to use it.
3. **Inputs and assumptions:** what is user-entered, defaulted and editable.
4. **How results are calculated:** logic/formulas, units, time horizons and relevant limitations, **verified against actual code**.
5. **Salary benchmarks:** providers/data sources, role matching, geography, freshness, currency and NET/GROSS caveats.
6. **Automated values and manual overrides:** why a value appeared, what to do if it is wrong or missing.
7. **How to interpret recommendations:** what they mean and what they do not prove.
8. **Limitations & edge cases:** unavailable scenarios, incomplete data and data-quality warnings.

Methodology must describe the **actual implementation**, not aspirational/pseudo formulas. Update it whenever the data/model behavior changes.

## 7. Functional/UI separation

**Belongs to the functional track (finish first):**

- Calculators' mathematical rules and business decisions
- Salary benchmark integrations and lookup quality (including matching specific roles)
- Conversions and normalization of monthly/yearly figures
- Internal rates and defaults
- Rate history tracking and persistence
- Missing/uncertain value handling logic

**Belongs to the UX/UI track (implement after logic is stable):**

- Dashboard composition and navigation
- Blue Lagoon visual styling and responsive behavior
- Cards, charts, labels, period displays, editable inputs, contextual help
- Clear explanation of automatic or missing values
- Methodology & Guide presentation
- Loading, empty, unavailable and error states

## 8. Current implementation (19 November 2026)

In the deliverable based on `HireOrGrow-main(1).zip` (v0.9.11), the Blue Lagoon visual style is applied to `index.html` and `styles.css`. Decision Overview charts appear above collapsed Financial Assumptions; a clear Edit Financial Assumptions button expands the original inputs. The new third in-app section, Methodology & Guide, describes the three separate calculation models, salary-evidence caveats, candidate readiness and the data/decision limitations. `app.js` adds only UI navigation/disclosure listeners and leaves formulas intact. `market.js`, `data/`, update scripts and Actions workflows are unchanged. The browser and source regression tests pass in the local test harness.

**Deployment status:** this code is not automatically uploaded to GitHub. Verify the ZIP and review before pushing to the existing repository.

## 9. Implementation sequence and acceptance checks

**Phase 1 — Stabilize logic (ongoing functional track)**
- Complete and validate financial calculators, market benchmarks, normalization, overrides, history and exception behavior.

**Phase 2 — Integrate approved UX/UI (implemented against uploaded v0.9.11 archive)**
- Apply Concept B and Blue Lagoon to the actual current application; reuse its existing components as sensible.
- Add Methodology & Guide with verified, accurate content.
- Do not rewrite calculation logic just to make the UI easier to style.

**Phase 3 — Validate and publish (local tests done; deployment pending)**
- Review desktop and smaller-screen usability.
- Confirm each displayed amount has the correct time unit and currency.
- Verify recommendation logic, chart data, empty/missing states, manual overrides and navigation.
- Check color contrast, keyboard accessibility and responsive layout.
- Commit UI work separately where feasible and push to the existing GitHub repository after review.

## 10. Open questions / intentionally not decided

- Final detailed design tokens (all surface shades, typography, radii, spacing and dark mode)
- Exact content, calculations, source citations and screenshots for Methodology & Guide (must reflect final implementation)
- Final responsive behavior and precise component layouts
- Exact repository structure/branch/deployment process (inspect repository when ready)
- Whether any additional changes to information architecture are required after real-user testing

## 11. Resume instruction for a future ChatGPT session

> We are continuing **HireOrGrow**. Read `docs/UX_UI_CONTEXT.md` before proposing UX/UI changes. Approved direction: **Concept B — Decision-first Dashboard**, **Blue Lagoon** palette (`#0C4255`, `#14849B`, `#169E8E`), and a separate **Methodology & Guide** inspired by Concept C. The approved UI has now been implemented against v0.9.11 in a downloadable archive; verify the current repository/branch before claiming deployment. Future functional work remains a separate track. Consult current source code for implementation status, and do not confuse an exported ZIP with the GitHub version. Cross-check real code and ask only for genuinely missing critical information.

---

**Maintenance:** When we change a design decision, update this file in the **same work session**. Record the date and what changed; keep it alongside code in the repository so it can be retrieved later. The project repository, not ChatGPT memory or downloadable sandbox links, should be the long-term storage location.


### 2026-11-19 — Masthead placement refinement

- The full Blue Lagoon gradient masthead is the first visible product block at the top of the application.
- The HireOrGrow wordmark and introductory copy appear together inside that masthead on all tabs.
- The duplicate hero formerly inside Decision Comparison is removed; calculation inputs now begin directly below navigation.
- Scenario Location remains inside the top masthead, with its existing functionality and accessible label unchanged.


### 2026-11-19 — Simplify the top masthead

- Keep the Blue Lagoon masthead at the very top, with the HireOrGrow wordmark.
- Show just one short, descriptive line: “Compare the costs of hiring, retaining and developing talent.”
- Remove the repeated tagline, eyebrow, large headline, long marketing paragraph, and version badge.
- Keep the Scenario Location control functional; the full explanation of its effects remains outside the promotional copy.
- Keep all calculators, salary data handling, and Methodology & Guide unchanged.


## UX decision (2026-11-20): Setup first, then comparison
- Workflow: select Position, Level, Scenario Location, Currency; review Financial Assumptions; press **Compare Scenarios**; then review independent result cards.
- Do not expose prefilled result cards before the user has reviewed the assumptions. Calculator math still runs as before and updates a revealed result live.
- The Financial Assumptions panel includes a live context bar with all four selected values. It mirrors the existing selectors rather than duplicating or converting their data.
- From the results, **Edit scenario settings** returns to the settings controls; per-card **Edit Assumptions** continues to open its detailed model.
- The Salary Benchmarks input form, evidence cards, tables and trend plots consistently use Blue Lagoon. No source or formula changes.


### 2026-11-20 — v3.2: Unified comparison setup (replaces the disclosure experiment)

- Put **all initial comparison inputs in one always-visible form**: Position, Level, Scenario Location; below them financial values, candidate feasibility, timing, Salary Input Period and an optional reporting Currency (USD default).
- Remove the interim "Before you compare" banner, extra button, numbered step and collapsible Financial Assumptions widget entirely. Neither text nor icons should rotate; there is no open/close action in the setup form.
- Move Scenario Location out of the masthead, which remains logo + one-line product description. The user sees the country alongside Position and Level, not in another part of the page.
- The selection of reporting currency is **optional**: USD remains the default. Source salary FX may be available; manually entered cost values are NOT automatically converted. Never imply a NET salary becomes GROSS by switching currency or period.
- Move the live four-field context summary to the **results view**, where it helps interpret a calculation. "Edit comparison" scrolls to the unified setup form; there is only one such button above the results, not a duplicate in the overview heading.
- Flow stays setup first → Compare Scenarios → results. Business formulas, sources and market data remain untouched.
