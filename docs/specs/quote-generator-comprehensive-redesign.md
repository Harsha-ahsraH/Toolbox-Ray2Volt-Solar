# Comprehensive Quotation Redesign: Page-by-Page Plan

Status: Draft for approval
Date: 2026-09-29
Design system: `tmp/comprehensive-design-system/index.html` (approved v1)
Tool: `tools/quote-generator/` (Comprehensive mode)

## Decisions made in this plan

| # | Decision | Choice |
|---|----------|--------|
| 1 | Length | Consolidate the 41 sections into about 24 body pages; section selector lists the merged sections, data fields unchanged |
| 2 | Story order | Value first: summary, site, system, energy and money, equipment, scope, company, price, sign |
| 3 | Front matter | Minimal cover (no KPI tiles), Contents + Document Control, two-page Executive Summary |
| 4 | Summary hook | "Today vs With Ray2Volt" panel + 25-year cumulative spend curves |
| 5 | Summary split | Page 3 = transformation only; page 4 = the offer at a glance |
| 6 | Company pages | One "Why Ray2Volt" page before the price; "Why C&I Solar" dropped; no stats strip until real figures exist |
| 7 | Free text | Each narrative field lands where a reader looks for it, excerpted at a full stop; full text in an annexure |
| 8 | BOM | Summary BOM (one row per category) in body; full BOM in annexure |
| 9 | Schedule | Indicative Gantt from a fixed size-band table: ≤100 kWp ≈ 6 wks, ≤500 kWp ≈ 10 wks, >500 kWp ≈ 14 wks |
| 10 | Returns | Add IRR as a derived value (no new input) |

Fixed constraints: inputs unchanged; header, footer, cover masthead and cover footer unchanged; white pages; inline-SVG charts only.

## Page plan

`§` = section number shown in the section opener and the Contents.
"Hybrid" notes apply only when System Configuration is Hybrid.

### Front matter

**P1: Cover** (no running header, unchanged masthead and footer)
- Eyebrow "Techno-Commercial Proposal", display title (proposal title), line "Prepared for <customer> · <site>".
- Cover hero image (existing `Cover Page Image.png`), full width.
- Minimal: no KPI tiles on the cover. The numbers first appear on P3–P4.
- Bottom: Attention card (contact, phone, email) + Offer card (installation type, metering, validity, revision).

**P2: Contents & Document Control**
- Left 2/3: numbered contents §01–§10 + Annexures, page numbers right-aligned.
- Right 1/3: document details: quotation no., date, revision, validity, prepared by, billing address, site address, GSTIN/CIN when entered.
- Foot: confidentiality note (existing copy).

### §01 Executive Summary (2 pages: the first impression)

**P3: What changes for you**
- Opener: "01 · Executive summary". Takeaway: "Your electricity bill falls by N% from the first month."
- **Hero: Today | With Ray2Volt panel.** Two columns and four rows. The "With" column is set in navy, the "Today" column in grey, with an arrow between each pair:
  1. Annual electricity bill: `consumption.annualBill` → annualBill − year-1 gross savings
  2. Effective cost per unit: average tariff → (investment + lifetime costs) ÷ lifetime generation
  3. Power drawn from the grid: 100% → (consumption − self-used solar) ÷ consumption
  4. CO₂ per year: consumption × grid factor → residual grid kWh × grid factor
  - Rows 1, 3 and 4 need consumption. If consumption is blank, those rows drop out; nothing is invented.
- **Proof: 25-year cumulative spend.** Line chart with two series, grid-only (grey) and with solar (navy, starting at the investment). Payback is marked where the lines cross, and the final gap is labelled "₹X Cr kept in the business".
- Deliberately nothing else on the page: generous white space.

**P4: The offer at a glance**
- Opener takeaway: "A turnkey X kWp plant for ₹Y, recovered in Z years."
- 4 KPI tiles: offered price (incl. GST), payback, year-1 saving, 25-year net saving.
- "What you get": 5–6 icon rows: system size, module make + warranty, inverter make + warranty, (Hybrid: battery kWh + make), mounting type, turnkey scope incl. net-metering liaison.
- "Next steps" numbered strip (existing `WHY_RAY2VOLT.nextSteps` copy).

### §02 Your site today

**P5: Your site & energy today**
- "What you asked for": two outlined cards, **Objective** and **Special requirements** (excerpted).
- Site facts card (site name, installation location or mixed locations, metering arrangement, customer type) beside 4 tiles: annual consumption, annual bill, average tariff, peak demand (Detailed mode only).
- Chart: monthly consumption bars (Detailed mode). Simple mode shows a headline band with monthly and annual kWh instead.

### §03 Proposed system

**P6: Proposed system at a glance**
- Tiles: DC kWp, AC kW, DC/AC ratio, (Hybrid: battery kWh / kW).
- System flow diagram (SVG): Sun → Modules → DC box → Inverter → AC panel → Net meter → Load / Grid. The Hybrid variant adds a Battery node on the inverter.
- **Proposed solution** narrative (excerpted).
- Installation approach as 3 icon features chosen by installation location (RCC / metal sheet / ground / carport / mixed).

**P7: Design basis & assumptions**
- **Existing system** and **Site conditions** narratives (excerpted).
- Assumptions table: specific yield, degradation, tariff and escalation, export rate, self-consumption / export split, projection years, costs.
- Standards and design references (existing design-basis copy) as a compact checklist.

### §04 Energy

**P8: Generation**
- Tiles: year-1 generation, specific yield (kWh/kWp), 25-year generation (MWh).
- Chart: **monthly generation vs consumption**, grouped bars. Needs a new fixed seasonal-profile table in code (not an input); consumption bars appear in Detailed mode only.
- Chart: 25-year annual generation line showing degradation.

**P9: Energy utilisation**
- Ring chart: self-used vs exported (kWh and %).
- Bill before / after bars for year 1.
- Short explainer of the metering arrangement (net metering copy from the existing section).

### §05 Savings & returns

**P10: Savings**
- Opener takeaway: "₹X saved in year 1, rising to ₹Y by year 25."
- Chart: annual net savings, 25 bars.
- Table: milestone years 1, 5, 10, 15, 20, 25 (generation, tariff, net saving, cumulative).
- Callout: basis of calculation; full year-by-year table in Annexure B.

**P11: Returns**
- Headline band: payback years.
- Chart: investment recovery (cumulative net position bars, payback marked).
- Tiles: investment, 25-year net saving, cost per unit, **IRR**.
- IRR is a new derived value: the internal rate of return of −(final price) followed by each year's net saving over the projection period, solved by bisection in `quote-generator-calc.js`. No new input. If it can't be solved (no positive return), the tile shows "n/a".

**P12: Environmental impact**
- Tiles: CO₂ avoided over 25 years, trees equivalent, clean energy (MWh), all from existing `derived.environmental`.
- Tree pictogram (navy icon array).
- Chart: CO₂ avoided per year (bars follow generation).
- Existing environmental note as the caption.

### §06 Equipment

**P13: Key equipment I**
- Component photo cards: PV modules, inverters, (Hybrid: battery). Each card shows make, type, rating × qty and warranty from the BOM rows, with a chip (Tier 1 / On-grid / Hybrid).
- Chart: module output warranty line (expected vs guaranteed).

**P14: Key equipment II**
- Photo cards: mounting structure, DC/AC distribution & protection, cables & connectors, earthing & lightning, monitoring & SCADA, metering.

**P15: Bill of materials (summary)**
- One row per BOM category (up to 14): thumbnail, category, key specification, make, quantity.
- Total row and a note: "Full line-by-line BOM in Annexure A."

### §07 Scope & delivery

**P16: Scope of work**
- Two columns: Included (✓ green) and Not included (✕ grey), from the existing inclusion and exclusion clause lists.
- If either list is long, the page splits into two with a continuation subtitle, never cramped.

**P17: Execution & schedule**
- Process steps (6 numbered circles) with a responsibility tag each: Ray2Volt / Customer / DISCOM.
- Indicative Gantt; weeks come from the size band.
- Existing schedule note (indicative, DISCOM delays excluded) as the caption.

**P18: Quality & safety**
- Two halves: quality checks and health & safety practices as icon card grids (existing copy).

**P19: Warranty & support**
- Chart: warranty timeline, one horizontal bar per component in years (module product / output, inverter, structure, battery, workmanship) from BOM warranty text and the existing warranty section.
- Support / O&M commitments as icon features.

### §08 Why Ray2Volt

**P20: Why Ray2Volt**
- Lead paragraph (existing About copy, shortened).
- In-house capabilities + differentiators as 6–8 icon cards (merged from About and Why Ray2Volt).
- No stats strip until real figures are supplied.

### §09 Commercial

**P21: Commercial offer**
- Headline band: offered price incl. GST, with ₹/Wp when "show price per Wp" is on.
- Price table: project cost, discounts, taxable value, GST split (CGST+SGST or IGST), final price.
- Chart: price breakdown bars, shown only when a price breakdown is entered.

**P22: Payment milestones**
- Stacked milestone bar (sequential navy ramp) and a table: milestone, %, amount, note.

**P23: Terms & conditions**
- Text page(s) with the existing clause list in two columns, numbered. The only intentionally text-dense section; it may run to a second page.

### §10 Acceptance

**P24: Acceptance & signature**
- Short acceptance statement, offer reference, validity.
- Two signature blocks (customer / Ray2Volt), with name, designation, date and seal boxes.

### Annexures (after the body; not counted in the ~24)

- **Annexure index** (existing auto section).
- **A. Full bill of materials:** the current full BOM table.
- **B. Year-by-year projection:** the current 25-year savings table.
- **C. Project background (full text):** all six narrative fields in full, printed only when any field was excerpted.
- **D onward:** user-attached annexures (existing behaviour).

## Old → new section mapping

| New | Absorbs old sections |
|-----|----------------------|
| Cover | cover |
| Contents & Document Control | contents, document-control |
| §01 Executive Summary | executive-summary |
| §02 Your Site Today | customer-project-profile, project-objectives (objective, special requirements), consumption-profile |
| §03 Proposed System | proposed-solution, system-architecture, installation-approach, design-basis |
| §04 Energy | generation-assessment, energy-utilization |
| §05 Savings & Returns | savings-projection, returns-analysis, environmental-impact |
| §06 Equipment | pv-module-technology, inverter-technology, battery-technology, mounting-structure, balance-of-system, monitoring-scada, bill-of-materials (summary) |
| §07 Scope & Delivery | scope-inclusions, scope-exclusions, execution-methodology, project-schedule, quality-assurance, health-safety, warranty-support |
| §08 Why Ray2Volt | about-ray2volt, why-ray2volt (ci-solar-benefits dropped) |
| §09 Commercial | commercial-offer, payment-milestones, terms-conditions |
| §10 Acceptance | acceptance |
| Annexures | annexure-index, annexures + new A/B/C |

The section selector shows the 12 new sections. Presets select all of them; Hybrid-only content toggles on configuration, not selection.

## New derived values (no new inputs)

- Monthly seasonal generation profile (fixed table in code).
- Schedule size bands (fixed table in code).
- Before/after figures for P3: residual bill, grid share, cost per unit, CO₂ per year (from existing projection and consumption).
- Grid emission factor for "CO₂ today": reuse the constant behind `derived.environmental`.
- IRR over the projection period (approved 2026-09-29).
