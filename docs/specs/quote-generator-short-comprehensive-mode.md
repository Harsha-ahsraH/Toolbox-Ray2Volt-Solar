# Quote Generator: Short and Comprehensive Proposal Modes

Status: Implementation specification  
Date: 2026-08-11  
Repository baseline: `main` at `09f8ee0`  
Primary tool: `tools/quote-generator/`

## 1. Objective

Extend the existing Quote Generator so it supports two Proposal modes from one shared authoring tool:

1. **Short Quotation** — preserve the current 8-page residential/light-commercial Proposal.
2. **Comprehensive Quotation** — generate a modular, normally 20+ page C&I solar EPC techno-commercial Proposal.

The Toolbox remains the source of truth for inputs, templates, preview, and PDF generation. Canva is not part of the operational workflow; it may only be used separately to create static visual assets.

## 2. Confirmed Product Decisions

- Put a Short/Comprehensive mode toggle at the top of the Quote Generator.
- Both modes share one form data model. Switching modes must preserve shared values.
- Comprehensive mode reveals additional C&I inputs and a Proposal-section selector.
- Use multi-open accordion panels. Any combination of panels may remain open.
- Provide **Expand All** and **Collapse All**.
- Proposal sections have a fixed output order; there is no drag-to-reorder control.
- Every Comprehensive section is selectable/removable.
- Default Comprehensive presets select at least 20 pages, but users may deliberately reduce the final document below 20 pages.
- Project-specific content is edited through structured fields, repeaters, and clause lists.
- Standard Ray2Volt pages are selectable but their maintained copy is not edited per quotation.
- Use separate **Inputs** and **Proposal Preview** workspace tabs.
- Preview uses fixed-order page thumbnails and one large A4 page.
- The current draft autosaves locally.
- No business-data API or external backend is required.

## 3. Existing Behavior That Must Remain Intact

- Short mode renders the current eight A4 pages:
  1. Cover
  2. Proposal Overview
  3. How Your System Works
  4. Technology & Installation
  5. Bill of Materials
  6. Commercial Offer
  7. Savings & ROI
  8. Terms & Conditions
- Installation Type continues to support exactly **On-Grid** and **Hybrid**. Do not restore Off-Grid.
- Preserve the existing Short Proposal content, calculations, quotation numbering, print styling, and PDF output unless this specification explicitly changes an input shared with Comprehensive mode.
- Preserve the fixed 210 mm × 297 mm `.quote-page` preview/print contract.
- Preserve the shared `Ray2VoltPdfDownload.downloadPages` integration.
- Existing `tests/quote-generator.test.js` assertions for the eight-page Short Proposal must continue to pass after being updated only where labels or script organization necessarily change.

## 4. Information Architecture

### 4.1 Global controls

Render these controls above the workspaces:

1. **Proposal Mode:** Short Quotation / Comprehensive Quotation
2. **Comprehensive Preset** (visible only in Comprehensive mode):
   - C&I On-Grid Rooftop
   - C&I Ground-Mounted
   - C&I Hybrid
3. **Workspace:** Inputs / Proposal Preview
4. Draft-save status: Saving… / Saved locally / Save failed

Changing a Comprehensive preset must request confirmation before replacing section selections, narrative defaults, and BOM defaults. It must not erase customer or commercial data.

### 4.2 Input accordion order

1. Proposal Sections — Comprehensive only
2. Customer Details
3. Project Settings
4. Project Description & Scope — Comprehensive only
5. Bill of Materials
6. Commercial Offer
7. Savings Projections
8. Terms, Inclusions & Exclusions
9. Annexures — Comprehensive only

Each panel header shows one state: **Incomplete**, **Complete**, or **Error**. Panels expand independently. Panel state does not depend on whether another panel is open.

### 4.3 Proposal Preview workspace

- Left/sidebar: thumbnail and title for every generated page in current fixed order.
- Main area: one large A4 page selected from the thumbnails.
- No page reordering.
- Show current dynamic page number and total.
- Provide Print / Save as PDF and Download PDF here.
- On narrow screens, replace the persistent thumbnail sidebar with a compact page selector.
- Preview may render placeholders for missing inputs.

## 5. Form Data Model

Implement a versioned serializable state object. Use stable IDs for repeatable rows and selected sections.

```js
{
  schemaVersion: 1,
  mode: 'short' | 'comprehensive',
  preset: 'ci-on-grid-rooftop' | 'ci-ground-mounted' | 'ci-hybrid',
  selectedSectionIds: [],
  customer: {},
  project: {},
  projectNarrative: {},
  bom: { categories: [] },
  commercial: {},
  savings: {},
  contract: {},
  annexures: [],
  dirtyDefaultFields: [],
  updatedAt: ''
}
```

Do not store derived totals as competing authoritative values. Derive them from source fields when rendering or validating.

## 6. Input Specifications

### 6.1 Proposal Sections

Display a grouped checklist in the fixed order defined in Section 9.

Controls:

- Select Recommended
- Select All
- Clear Optional Sections
- Estimated page count

Unchecking a section omits it from preview, print, and PDF but retains its entered data. Selecting it again restores its prior content.

### 6.2 Customer Details

First field: **Customer Type** — Company / Individual.

Company fields:

- Legal company name — required
- Contact person — required
- Designation
- Phone number — required
- Email address
- GSTIN
- CIN
- Registered/billing address — required
- Project/site address — required
- “Same as registered address” checkbox

Individual fields:

- Customer name — required
- Phone number — required
- Email address
- GSTIN, optional
- Address — required
- Project/site address, with same-address checkbox

Hide company-only fields in Individual mode without deleting their stored values.

### 6.3 Project Settings

Document identity:

- Quote date — required
- Quotation Number — required; preserve current auto-generation behavior
- Project/Proposal title — default generated text, editable
- Project/site name
- Prepared by
- Proposal revision number — default `Rev 0`
- Quotation validity in days — default `15`

System definition:

- System Configuration — On-Grid / Hybrid
- Solar DC capacity in kWp — required, authoritative
- Inverter AC capacity in kW — required in Comprehensive mode, authoritative
- Displayed DC/AC ratio — derived and read-only
- Battery energy capacity in kWh — Hybrid only, required for Comprehensive Hybrid
- Battery power rating in kW — Hybrid only, required for Comprehensive Hybrid

Installation Location is independent of System Configuration:

- RCC rooftop
- Metal-sheet rooftop
- Ground-mounted
- Carport
- Mixed

For Mixed, use repeatable rows containing location type and allocated DC capacity. Display the allocated-capacity total and compare it with project DC capacity.

Short mode continues to show the familiar System Capacity field. It maps to `project.dcCapacityKwp`.

### 6.4 Project Description & Scope

Comprehensive-only multiline fields:

- Customer’s project objective
- Existing electrical-system summary
- Proposed solar solution summary
- Site conditions or constraints
- Special customer requirements
- General project notes

Default behavior:

- Load editable defaults once from the chosen preset/System Configuration/Installation Location.
- Never overwrite a field after the user edits it.
- Provide **Restore Default** beside each field.
- Provide **Restore All Defaults** for the panel.
- Track touched/default-restored state explicitly rather than guessing from string equality.

Defaults must be conservative and must not invent customer facts. Unknown technical facts should appear as neutral wording such as “subject to detailed site verification,” not fabricated values.

### 6.5 Bill of Materials

#### Categories

1. Solar PV modules
2. Inverters
3. Battery system — Hybrid only
4. Module mounting structures
5. DC cables and connectors
6. AC cables and power evacuation
7. DCDB, ACDB and protection devices
8. Earthing and lightning protection
9. Monitoring, communication and SCADA
10. Metering and synchronization
11. Safety equipment and signage
12. Civil and miscellaneous works
13. Installation, testing and commissioning
14. Transportation and documentation

Hide empty categories from the generated Proposal.

#### Row fields

- Component/item name
- Technical specification or model
- Make/manufacturer
- Quantity
- Unit
- Warranty
- Remarks or scope note

Modules, inverters, and batteries also expose numeric rating and rating-unit fields for reconciliation. Do not add country of origin.

#### Authoring behavior

- Load detailed default rows from the chosen preset and System Configuration/Installation Location.
- Allow Add, Remove, Duplicate, and Edit per row.
- Provide Reset to Defaults with confirmation.
- Do not use drag-to-reorder.
- Preserve current Short-mode defaults and columns where possible; Comprehensive mode uses the expanded row editor.

#### Capacity reconciliation

- Project Settings is authoritative.
- Derive module total as module rating × quantity.
- Derive inverter AC total as inverter rating × quantity.
- Derive battery energy/power totals from relevant battery rows.
- Display approved and BOM-derived totals together.
- Treat a difference greater than the larger of 0.1 kW/kWp/kWh or 0.5% as a mismatch.
- A mismatch is a critical validation error but never silently overwrites either source.
- Comprehensive BOM output must occupy at least one complete A4 page and create continuation pages when rows overflow.

### 6.6 Commercial Offer

Fields:

- Actual Project Cost, including GST — required and authoritative
- GST Type — Intra-State (CGST + SGST) / Inter-State (IGST)
- GST percentage

Optional price breakdown repeater:

- Description
- GST-inclusive amount

If rows exist, show their sum beside Actual Project Cost. A mismatch is a visible warning; the manually entered Actual Project Cost remains authoritative.

Named discount repeater:

- Discount name
- Discount amount

Start with one empty row. Allow Add and Remove. Discount total must not exceed Actual Project Cost.

Payment milestone repeater:

- Milestone name or payment trigger
- Payment percentage
- Calculated payment amount, read-only
- Optional note or due condition

Show a running percentage total. Percentages must total 100% within 0.01 percentage point. Otherwise show a critical error.

### 6.7 Savings Projections

#### Consumption entry method

Allow **Simple** and **Detailed C&I**.

Simple:

- Current electricity tariff in INR/kWh
- Average monthly consumption in kWh

Detailed C&I: fixed 12-month table with:

- Month
- Imported energy in kWh
- Electricity bill amount
- Maximum demand in kVA

Short mode uses Simple. Comprehensive mode can use either.

#### Generation and utilization assumptions

- Annual generation in kWh/kWp
- Tariff escalation percentage
- Annual module degradation percentage
- Projection period in years — default 30; accept custom positive integer
- Estimated self-consumption percentage
- Estimated grid-export percentage
- Export/net-metering credit rate in INR/kWh
- Arrangement type — Net Metering / Gross Metering / Open Access / Captive / Other

Self-consumption and export percentages must total 100% within 0.01 percentage point.

#### Future cost repeater

- Cost name
- Starting amount
- Annual escalation percentage
- Starting year
- Ending year

The same start and end year represents a one-time cost. This supports O&M, insurance, monitoring subscriptions, and replacement provisions.

The existing shared solar-returns module remains the preferred calculation dependency where applicable. Expanded financial logic may be implemented in a separate pure module; do not embed all calculations directly in DOM code.

### 6.8 Terms, Inclusions & Exclusions

Use three independent clause-list editors:

1. Terms and Conditions
2. Scope Inclusions
3. Scope Exclusions

Each clause row contains:

- Include checkbox
- Clause text
- Delete control

Behavior:

- Load Ray2Volt standard clauses by default.
- Allow editing, addition, deletion, and enable/disable.
- Provide Restore Standard Defaults per list.
- Render only enabled clauses.
- Maintain stable numbering after filtering.

Store default clause libraries in configuration/template code, not embedded repeatedly in HTML.

### 6.9 Annexures

Comprehensive-only repeatable attachments:

- File upload accepting image or PDF
- Annexure title
- Type — Drawing / Datasheet / Certificate / Site Photograph / Other
- Include checkbox
- Upload order, read-only

No detailed media/drawing workspace is required. Project-specific files are appended only after the main Proposal in upload order.

Implementation requirements:

- Persist serializable form metadata in local storage.
- Persist selected File/Blob content in IndexedDB so annexures survive refresh on the same browser/device.
- Render image annexures as scaled A4 pages.
- Render every uploaded PDF page as its own annexure page using a lazily loaded PDF renderer such as PDF.js; preserve aspect ratio.
- If the dependency cannot load, keep the main Proposal usable and show a clear annexure-specific error.
- Do not upload annexures to a server.

## 7. Autosave, Reset, and State Migration

- Debounce autosave by approximately 500 ms after changes.
- Local storage key: `ray2volt.quote-generator.draft.v1`.
- IndexedDB database: `ray2volt-quote-generator`, version 1, with an `annexures` object store keyed by attachment ID.
- Show Saving…, Saved locally, or Save failed.
- Restore the latest draft on reload.
- Provide **New Quotation**, which clears state and stored annexures after confirmation, then reinitializes defaults and a new Quotation Number.
- Provide **Reset Current Panel** after confirmation.
- Multiple named drafts and cloud storage are out of scope.
- All persisted state must contain `schemaVersion`; unknown future versions must fail safely by offering to start a new draft, not by throwing during page load.

## 8. Validation

### 8.1 Panel states

- Incomplete: required inputs are absent but there is no invalid entered value.
- Complete: all required inputs for the active mode are present and valid.
- Error: one or more entered values conflict or fail validation.

### 8.2 Validation summary

- Show a summary near the top of Inputs.
- Each error/warning links to and expands the relevant panel.
- Use inline field messages as well as the summary.
- Do not rely on color alone.

### 8.3 Critical errors

At minimum:

- Missing required customer identity/contact/address
- Missing Quote Date or Quotation Number
- Missing required DC/AC/Hybrid capacity
- Missing Actual Project Cost
- BOM capacity mismatch
- Payment milestones not totalling 100%
- Self-consumption/export split not totalling 100%
- Invalid negative amounts, quantities, percentages, or years

Preview remains available with explicit placeholders. Print/Save as PDF and Download PDF must be disabled when critical errors exist. Optional fields never block final output.

## 9. Comprehensive Proposal Section Library

Every section has a stable ID, fixed order, include checkbox, title, and renderer. A selected section may produce one or more pages when its content overflows. Dynamic footers must show `Page X of Y` after filtering and annexure expansion.

The following is the implementation baseline. Standard copy should be professional, factual, concise, and free of unverified claims.

1. `cover` — Cover page: proposal title, customer, site, capacity, configuration, quotation number/date/revision.
2. `document-control` — Prepared for/by, contact details, revision, validity, confidentiality note.
3. `contents` — Dynamic table of contents with final page numbers.
4. `executive-summary` — Customer objective, proposed solution, capacity, headline commercial and savings metrics.
5. `customer-project-profile` — Customer/site details and high-level project facts.
6. `project-objectives` — Editable objective, existing system, constraints, and special requirements.
7. `about-ray2volt` — Maintained company profile.
8. `ci-solar-benefits` — Maintained C&I solar value proposition without customer-specific promises.
9. `proposed-solution` — System configuration, capacities, installation allocations, and scope summary.
10. `system-architecture` — Standard C&I energy-flow schematic chosen by configuration; project drawings remain annexures.
11. `installation-approach` — Rooftop/ground/carport/mixed installation approach.
12. `design-basis` — Generation, degradation, tariff, utilization, and analysis assumptions.
13. `pv-module-technology` — Maintained module technology overview plus selected BOM make/model/rating/warranty.
14. `inverter-technology` — Maintained inverter overview plus selected equipment and AC sizing.
15. `battery-technology` — Hybrid preset default; selected battery energy/power, chemistry, and warranty from BOM.
16. `mounting-structure` — Structure approach and material/specification drawn from BOM and installation location.
17. `balance-of-system` — Cables, DBs, protection, earthing, lightning, evacuation, and metering overview.
18. `monitoring-scada` — Monitoring/communications items and standard capabilities.
19. `bill-of-materials` — Categorized full-page BOM with continuation pages.
20. `generation-assessment` — Capacity, specific yield, Year-1 generation, degradation, and 30-year/custom generation summary.
21. `consumption-profile` — Simple summary or 12-month table with chart and maximum-demand information.
22. `energy-utilization` — Self-consumption/export split, arrangement type, and energy-flow summary.
23. `savings-projection` — Gross savings, export credits, future costs, and annual/milestone projection.
24. `returns-analysis` — Payback, ROI, IRR, and assumptions using the existing shared returns logic where possible.
25. `environmental-impact` — Conservative impact equivalents with calculation assumptions disclosed.
26. `scope-inclusions` — Enabled inclusion clauses.
27. `scope-exclusions` — Enabled exclusions plus customer responsibilities when appropriate.
28. `execution-methodology` — Maintained engineering, procurement, installation, testing, and commissioning steps.
29. `project-schedule` — Default C&I milestone sequence; durations remain generic unless a later project-specific schedule input is added.
30. `quality-assurance` — Maintained QA/QC checks and documentation approach.
31. `health-safety` — Maintained HSE approach and site-safety responsibilities.
32. `warranty-support` — Equipment warranties derived from BOM plus maintained service/support wording.
33. `commercial-offer` — Price breakdown, discounts, GST disclosure, and final offered price.
34. `payment-milestones` — Payment triggers, percentages, and amounts.
35. `terms-conditions` — Enabled terms clauses and quotation validity.
36. `why-ray2volt` — Maintained closing differentiators and next steps.
37. `acceptance` — Optional customer acceptance/signature block.
38. `annexure-index` — Generated only when included annexures exist; list titles/types/page numbers.
39. `annexures` — Generated attachment pages; selection is controlled by attachment include flags.

### 9.1 Preset rules

- Each preset must select at least 20 generated pages before annexures.
- `ci-on-grid-rooftop`: exclude battery technology by default; include rooftop-relevant installation and technical sections.
- `ci-ground-mounted`: exclude battery technology by default; include ground-mount installation, civil, safety, and execution sections.
- `ci-hybrid`: include battery technology and Hybrid architecture by default.
- All presets include Cover, Document Control, Contents, Executive Summary, BOM, Commercial Offer, Payment Milestones, and Terms by default.
- The user may uncheck any section after preset selection.

## 10. Standard Content Rules

- Maintain reusable Ray2Volt content centrally in a configuration/content module.
- Per-Proposal editing is not exposed for About Ray2Volt, C&I Solar Benefits, Execution Methodology, QA/QC, HSE, generic technology explanations, or Why Ray2Volt.
- Populate project-specific facts into those templates only from structured fields.
- Do not invent certifications, client counts, project capacity installed, awards, addresses, warranties, generation, or financial results.
- Reuse verified wording and company information already present in the existing Quote Generator where suitable.
- Contract clauses must remain editable because they were explicitly approved as clause-list inputs.

## 11. Recommended Code Organization

Avoid expanding the existing single HTML/JS files into unmaintainable monoliths. Keep the static browser architecture and introduce narrowly scoped modules, for example:

- `quote-generator-config.js` — modes, presets, section catalog, BOM/clauses/narrative defaults.
- `quote-generator-model.js` — pure state initialization, derived totals, reconciliation, and validation; expose CommonJS for Node tests and a browser global.
- `quote-generator-storage.js` — localStorage/IndexedDB persistence and migration.
- `quote-generator-form.js` — mode, accordion, repeaters, reset/default behavior.
- `quote-generator-comprehensive-pages-*.js` — split template/render functions for the Comprehensive Proposal.
- `quote-generator-preview.js` — selected-page rendering, thumbnails, navigation, dynamic numbering.
- Existing `quote-generator.js` — retain Short renderer and orchestrate shared behavior; refactor only as needed.
- Add focused CSS files for workspace controls, Comprehensive inputs, preview navigation, Comprehensive pages, responsive behavior, and print behavior; import them from `quote-generator.css` in a documented order.

Exact filenames may change if a cleaner boundary emerges, but state/validation, storage, form behavior, and document rendering must not be collapsed into one file.

Use the current page-template insertion pattern or replace it with an equally deterministic synchronous pattern. Do not introduce a build step or framework.

## 12. Accessibility and Responsive Requirements

- Mode and workspace controls must be keyboard operable and expose selected state.
- Accordions use buttons with `aria-expanded` and associated panels.
- Repeatable-row buttons have descriptive accessible names.
- Error messages associate with their fields and are announced appropriately.
- Maintain usable input layouts at mobile widths.
- Preview always represents the same fixed A4 canvas used for print/PDF; scale it rather than reflowing document content.
- Ensure focus moves to the selected Preview page and to panels opened from validation links.

## 13. PDF and Print Requirements

- Only selected Comprehensive sections are included.
- Page numbering and TOC are recalculated after selection and annexure expansion.
- Every `.quote-page` remains exactly A4 in preview, print, and PDF.
- Repeatable tables create continuation pages rather than overflowing or shrinking text to illegibility.
- BOM starts on a new page and receives at least one complete page.
- Annexure images/PDF pages preserve aspect ratio and remain inside A4 bounds.
- Preview, browser print, and downloaded PDF must contain the same page order and content.
- Filename format:
  - Short: preserve current naming.
  - Comprehensive: `Ray2Volt-Comprehensive-Proposal-{Customer}-{QuotationNumber}.pdf` with unsafe characters sanitized.

## 14. Testing Requirements

### 14.1 Preserve baseline

- `node tests/quote-generator.test.js` must pass.
- Do not touch the Letterheadify tool or its tests; they are outside this add-on's scope.

### 14.2 Add automated coverage

Extend the current test and/or add focused Node tests covering:

- Mode toggle and both workspace tabs exist.
- Short renderer still contains exactly eight pages.
- Every Comprehensive preset selects at least 20 non-annexure pages.
- Section output always follows catalog order regardless of selection order.
- Unselected sections are absent and their state is preserved.
- Customer Company/Individual visibility rules do not delete hidden values.
- Mixed-location capacity totals are derived correctly.
- Module/inverter/battery capacity reconciliation and tolerance.
- BOM add/remove/duplicate/reset behavior through pure state functions.
- Multiple discounts and totals.
- Payment milestone 100% validation.
- Self-consumption/export 100% validation.
- Default narrative dirty-field behavior and restore operations.
- Clause filtering and renumbering.
- State serialization/migration and safe failure on unknown schema version.
- Dynamic page numbering after filtering.
- A4 preview and print sizing remains exact.
- Critical errors disable both final-output actions but do not disable Preview.

Prefer pure model tests that require no third-party DOM test library. Static markup/CSS assertions may follow existing repository conventions.

### 14.3 Manual verification

Verify at minimum:

1. Short On-Grid quotation
2. Short Hybrid quotation
3. Comprehensive C&I On-Grid Rooftop preset
4. Comprehensive Ground-Mounted preset
5. Comprehensive Hybrid preset
6. A reduced custom section selection
7. Long BOM with continuation pages
8. Image and multi-page PDF annexures
9. Reload with autosaved data and annexures
10. Narrow-screen Inputs and Preview navigation
11. Browser Print and Download PDF page parity

## 15. Acceptance Criteria

The add-on is complete when:

- A visible top toggle switches between Short and Comprehensive modes without losing shared inputs.
- Short mode still produces the existing eight-page Proposal.
- Comprehensive mode offers the approved multi-open accordion input system and three presets.
- All approved input panels, repeaters, defaults, resets, and validations work.
- Default Comprehensive presets render at least 20 pages before annexures.
- Users can include/exclude every Comprehensive section without reordering it.
- The detailed BOM reconciles equipment totals with Project Settings and renders clean continuation pages.
- Standard content is centrally maintained; structured customer/project content is editable.
- Preview navigation, dynamic TOC/page numbering, print, and PDF all agree.
- Local autosave restores the current draft, including annexure blobs on the same device.
- Automated tests pass and the five principal mode/preset paths are manually verified.
- No unrelated user changes are overwritten.

## 16. Explicit Non-Goals for This Add-on

- Canva integration or automated Canva document generation
- Cloud accounts, cloud draft storage, or collaboration
- Multiple named-draft management
- CRM integration
- Electronic signatures
- Freeform desktop-publishing/page editing
- Drag-and-drop section ordering
- User-edited standard company copy inside each quotation
- Off-Grid system support
- Uploading project documents to any server

## 17. Implementation Sequence

1. Introduce versioned model/config modules with pure tests.
2. Add mode toggle, workspace tabs, accordion shell, validation summary, and autosave.
3. Migrate current Short inputs into the shared model without changing Short output.
4. Implement Customer, Project, Narrative, BOM, Commercial, Savings, and Contract editors.
5. Implement section catalog/presets and Comprehensive page renderers.
6. Add thumbnails, dynamic numbering, TOC, and continuation-page handling.
7. Add annexure IndexedDB storage and image/PDF rendering.
8. Complete print/PDF integration, responsive behavior, tests, and manual visual verification.

Do not mark the task complete after building only the form. Completion requires both modes, Comprehensive Proposal rendering, annexures, validation, persistence, and verified final output.
